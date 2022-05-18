// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Holding.sol";

import "./libraries/OperationsLib.sol";

import "./interfaces/IDexManager.sol";
import "./interfaces/core/IHoldingManager.sol";
import "./interfaces/core/IHolding.sol";
import "./interfaces/core/IManager.sol";
import "./interfaces/core/IStrategy.sol";
import "./interfaces/core/IStrategyManager.sol";
import "./interfaces/core/IStablesManager.sol";
import "./interfaces/stablecoin/ISharesRegistry.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

//TODO: should we add a way for the factory's owner to save funds from the holding contract?

/// @title HoldingManager contract
/// @author Cosmin Grigore (@gcosmintech)
contract HoldingManager is IHoldingManager, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice returns holding for user
    mapping(address => address) public override userHolding;

    /// @notice returns user for holding
    mapping(address => address) public override holdingUser;

    /// @notice returns true if holding was created
    mapping(address => bool) public override isHolding;

    /// @notice returns the pause state of the contract
    bool public override paused;

    /// @notice contract that contains the address of the manager contract
    IManagerContainer public immutable override managerContainer;

    /// @notice mapping of minters of each holding (holding address => minter address)
    mapping(address => address) public override holdingMinter; // holding => minter

    /// @notice mapping of available holdings by position (position=>holding address)
    mapping(uint256 => address) public override availableHoldings;

    /// @notice position of the first available holding
    uint256 public override availableHoldingsHead;

    /// @notice position of the last available holding
    uint256 public override availableHoldingsTail;

    /// @notice creates a new HoldingManager contract
    /// @param _managerContainer contract that contains the address of the manager contract
    constructor(address _managerContainer) {
        require(_managerContainer != address(0), "3065");
        managerContainer = IManagerContainer(_managerContainer);
    }

    // -- Owner specific methods --
    /// @notice sets a new value for pause state
    /// @param _val the new value
    function setPaused(bool _val) external override onlyOwner {
        emit PauseUpdated(paused, _val);
        paused = _val;
    }

    /// @notice assigns a new user to an existing holding
    /// @dev callable by owner only
    /// @param user user's address
    function assignHolding(address user)
        external
        override
        onlyOwner
        nonReentrant
        validAddress(user)
    {
        _assignHolding(user);
    }

    // -- View type methods --
    function numAvailableHoldings() public view override returns (uint256) {
        return availableHoldingsTail - availableHoldingsHead;
    }

    // -- User specific methods --
    /// @notice creates holding and leaves it available to be assigned
    function createHolding()
        external
        override
        nonReentrant
        notPaused
        returns (address)
    {
        require(
            numAvailableHoldings() < _getManager().maxAvailableHoldings(),
            "2000"
        );
        address holdingAddress = _createHolding();
        availableHoldings[availableHoldingsTail] = holdingAddress;
        availableHoldingsTail += 1;
        if (msg.sender != owner()) {
            address protocolToken = _getManager().protocolToken();
            require(protocolToken != address(0), "1100");
            uint256 mintingTokenReward = _getManager().mintingTokenReward();
            IERC20(protocolToken).safeTransfer(msg.sender, mintingTokenReward);
        }
        return holdingAddress;
    }

    /// @notice creates holding at assigns it to the user
    function createHoldingForMyself()
        external
        override
        nonReentrant
        notPaused
        returns (address)
    {
        require(userHolding[msg.sender] == address(0), "1101");
        address holdingAddress = _createHolding();
        userHolding[msg.sender] = holdingAddress;
        holdingUser[holdingAddress] = msg.sender;
        emit HoldingAssigned(holdingAddress, msg.sender, msg.sender);
        return holdingAddress;
    }

    /// @notice user grabs an existing holding, with a deposit
    function assignHoldingToMyself() external override nonReentrant notPaused {
        address holding = _assignHolding(msg.sender);

        // solhint-disable-next-line var-name-mixedcase
        address USDC = _getManager().USDC();
        uint256 firstDepositAmount = _getManager().firstDepositAmount();
        IERC20(USDC).safeTransferFrom(msg.sender, holding, firstDepositAmount);

        emit Deposit(holding, USDC, firstDepositAmount);
    }

    /// @notice deposits a whitelisted token into the holding
    /// @param _token token's address
    /// @param _amount amount to deposit
    function deposit(address _token, uint256 _amount)
        external
        override
        validToken(_token)
        validAmount(_amount)
        validHolding(userHolding[msg.sender])
        nonReentrant
        notPaused
    {
        IERC20(_token).safeTransferFrom(
            msg.sender,
            userHolding[msg.sender],
            _amount
        );

        _getStablesManager().addCollateral(
            userHolding[msg.sender],
            _token,
            _amount
        );

        emit Deposit(userHolding[msg.sender], _token, _amount);
    }

    /// @notice withdraws a token from a holding to a user
    /// @param _token token user wants to withdraw
    /// @param _amount withdrawal amount
    function withdraw(address _token, uint256 _amount)
        external
        override
        validAddress(_token)
        validAmount(_amount)
        validHolding(userHolding[msg.sender])
        nonReentrant
        notPaused
    {
        //perform the check to see if this is an airdropped token or user actually has collateral for it
        (, address _tokenRegistry) = _getStablesManager().shareRegistryInfo(
            _token
        );
        if (
            _tokenRegistry != address(0) &&
            ISharesRegistry(_tokenRegistry).collateral(
                userHolding[msg.sender]
            ) >
            0
        ) {
            _getStablesManager().removeCollateral(
                userHolding[msg.sender],
                _token,
                _amount
            );
        }

        IHolding(userHolding[msg.sender]).transfer(_token, msg.sender, _amount);
    }

    /// @notice exchanges an existing token with a whitelisted one
    /// @param _ammId selected AMM id
    /// @param _tokenIn token available in the contract
    /// @param _tokenOut token resulting from the swap operation
    /// @param _amountIn exchange amount
    /// @param _minAmountOut min amount of tokenOut to receive when the swap is performed
    /// @param _data specific amm data
    /// @return the amount obtained
    function exchange(
        uint256 _ammId,
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _minAmountOut,
        bytes calldata _data
    )
        external
        override
        validAmount(_amountIn)
        validToken(_tokenOut)
        validHolding(userHolding[msg.sender])
        nonReentrant
        notPaused
        returns (uint256)
    {
        require(_minAmountOut > 0, "2100");

        IHolding(userHolding[msg.sender]).approve(
            _tokenIn,
            address(this),
            _amountIn
        );
        IERC20(_tokenIn).safeTransferFrom(
            userHolding[msg.sender],
            address(this),
            _amountIn
        );

        OperationsLib.safeApprove(
            _tokenIn,
            _getManager().dexManager(),
            _amountIn
        );
        uint256 amountSwapped = IDexManager(_getManager().dexManager()).swap(
            _ammId,
            _tokenIn,
            _tokenOut,
            _amountIn,
            _minAmountOut,
            _data
        );
        _getStablesManager().migrateDataToRegistry(
            userHolding[msg.sender],
            _tokenIn,
            _tokenOut,
            _amountIn,
            amountSwapped
        );

        IERC20(_tokenOut).safeTransfer(userHolding[msg.sender], amountSwapped);

        return amountSwapped;
    }

    /// @notice mints stablecoin to the user or to the holding contract
    /// @param _token collateral token
    /// @param _amount the borrowed amount
    /// @param _mintDirectlyToUser if true mints to user instead of holding
    function borrow(
        address _token,
        uint256 _amount,
        bool _mintDirectlyToUser
    )
        external
        override
        nonReentrant
        notPaused
        validHolding(userHolding[msg.sender])
        returns (
            uint256 part,
            uint256 share,
            uint256 fee
        )
    {
        (part, share, fee) = _getStablesManager().borrow(
            userHolding[msg.sender],
            _token,
            _amount,
            _mintDirectlyToUser
        );

        emit Borrowed(
            userHolding[msg.sender],
            _token,
            _amount,
            fee,
            _mintDirectlyToUser
        );
    }

    /// @notice borrows from multiple assets
    /// @param _data struct containing data for each collateral type
    /// @param _mintDirectlyToUser if true mints to user instead of holding
    function borrowMultiple(
        BorrowOrRepayData[] calldata _data,
        bool _mintDirectlyToUser
    )
        external
        override
        validHolding(userHolding[msg.sender])
        nonReentrant
        notPaused
    {
        require(_data.length > 0, "3006");
        for (uint256 i = 0; i < _data.length; i++) {
            (, , uint256 fee) = _getStablesManager().borrow(
                userHolding[msg.sender],
                _data[i].token,
                _data[i].amount,
                _mintDirectlyToUser
            );
            emit Borrowed(
                userHolding[msg.sender],
                _data[i].token,
                _data[i].amount,
                fee,
                _mintDirectlyToUser
            );
        }

        emit BorrowedMultiple(
            userHolding[msg.sender],
            _data.length,
            _mintDirectlyToUser
        );
    }

    /// @notice repays multiple assets
    /// @param _data struct containing data for each collateral type
    /// @param _repayFromUser if true it will burn from user's wallet, otherwise from user's holding
    function repayMultiple(
        BorrowOrRepayData[] calldata _data,
        bool _repayFromUser
    )
        external
        override
        validHolding(userHolding[msg.sender])
        nonReentrant
        notPaused
    {
        require(_data.length > 0, "3006");

        for (uint256 i = 0; i < _data.length; i++) {
            uint256 amount = _getStablesManager().repay(
                userHolding[msg.sender],
                _data[i].token,
                _data[i].amount,
                _repayFromUser,
                false
            );
            emit Repayed(
                userHolding[msg.sender],
                _data[i].token,
                amount,
                _repayFromUser
            );
        }

        emit RepayedMultiple(
            userHolding[msg.sender],
            _data.length,
            _repayFromUser
        );
    }

    /// @notice registers a repay operation
    /// @param _token collateral token
    /// @param _amount the repayed amount
    /// @param _repayFromUser if true it will burn from user's wallet, otherwise from user's holding
    function repay(
        address _token,
        uint256 _amount,
        bool _repayFromUser
    )
        external
        override
        nonReentrant
        notPaused
        validHolding(userHolding[msg.sender])
        returns (uint256 amount)
    {
        amount = _getStablesManager().repay(
            userHolding[msg.sender],
            _token,
            _amount,
            _repayFromUser,
            false
        );
        emit Repayed(userHolding[msg.sender], _token, amount, _repayFromUser);
    }

    /// @notice method used to pay stablecoin debt by using own collateral
    /// @param _token token to be used as collateral
    /// @param _amount the amount of stablecoin to repay
    function selfLiquidate(
        address _token,
        uint256 _amount,
        SelfLiquidateData calldata _data
    )
        external
        override
        nonReentrant
        notPaused
        validHolding(userHolding[msg.sender])
        returns (uint256)
    {
        (, address shareRegistry) = _getStablesManager().shareRegistryInfo(
            _token
        );
        ISharesRegistry registry = ISharesRegistry(shareRegistry);

        uint256 _borrowed = registry.borrowed(userHolding[msg.sender]);
        require(_borrowed >= _amount, "2003");

        (bool updated, ) = registry.updateExchangeRate();
        require(updated, "3005");

        uint256 _collateralNeeded = _getStablesManager()
            .computeNeededCollateral(_token, _amount);
        require(_collateralNeeded > 0, "3004");

        _retrieveCollateral(
            _token,
            userHolding[msg.sender],
            _collateralNeeded,
            _data._strategies,
            _data._strategiesData
        );

        //send collateral to feeAddress
        IHolding(userHolding[msg.sender]).transfer(
            _token,
            _getManager().feeAddress(),
            _collateralNeeded
        );

        //remove debt
        _getStablesManager().repay(
            userHolding[msg.sender],
            _token,
            _amount,
            false,
            true
        );

        //remove collateral
        _getStablesManager().removeCollateral(
            userHolding[msg.sender],
            _token,
            _collateralNeeded
        );

        emit SelfLiquidated(
            userHolding[msg.sender],
            _token,
            _amount,
            _collateralNeeded
        );
        return _collateralNeeded;
    }

    /// @notice liquidate user
    /// @dev if user is solvent liquidation won't work
    /// @param _liquidatedHolding address of the holding which is being liquidated
    /// @param _token collateral token
    /// @param _data liquidation data
    /// @return result true if liquidation happened
    /// @return collateralAmount the amount of collateral to move
    /// @return protocolFeeAmount the protocol fee amount
    function liquidate(
        address _liquidatedHolding,
        address _token,
        LiquidateData calldata _data
    )
        external
        override
        validHolding(_liquidatedHolding)
        validHolding(userHolding[msg.sender])
        nonReentrant
        notPaused
        returns (
            bool result,
            uint256 collateralAmount,
            uint256 protocolFeeAmount
        )
    {
        (result, collateralAmount, protocolFeeAmount) = _getStablesManager()
            .liquidate(
                _liquidatedHolding,
                _token,
                userHolding[msg.sender],
                _data._burnFromUser
            );
        if (_data._maxLoss > 0) {
            uint256 liquidationMaxLossPrecision = IManager(
                managerContainer.manager()
            ).LIQUIDATION_MAX_LOSS_PRECISION();
            require(_data._maxLoss < liquidationMaxLossPrecision, "3027");
            collateralAmount =
                collateralAmount -
                (collateralAmount * _data._maxLoss) /
                liquidationMaxLossPrecision;
            protocolFeeAmount =
                protocolFeeAmount -
                (protocolFeeAmount * _data._maxLoss) /
                liquidationMaxLossPrecision;
        }
        if (result) {
            _retrieveCollateral(
                _token,
                _liquidatedHolding,
                collateralAmount + protocolFeeAmount,
                _data._strategies,
                _data._strategiesData
            );

            _moveCollateral(
                _liquidatedHolding,
                _token,
                userHolding[msg.sender],
                collateralAmount,
                true
            );

            _moveCollateral(
                _liquidatedHolding,
                _token,
                _getManager().feeAddress(),
                protocolFeeAmount,
                false
            );
        }
    }

    // -- Private methods --

    /// @notice creates a new holding contract
    function _createHolding() private returns (address) {
        require(managerContainer.manager() != address(0), "3003");
        // solhint-disable-next-line avoid-tx-origin
        if (msg.sender != tx.origin) {
            //EXTCODESIZE is hackable if called from a contract's constructor
            //it will return false since the contract isn't created yet
            require(_getManager().isContractWhitelisted(msg.sender), "1000");
        }
        Holding _holding = new Holding(address(managerContainer));
        isHolding[address(_holding)] = true;
        emit HoldingCreated(msg.sender, address(_holding));
        holdingMinter[address(_holding)] = msg.sender;
        return address(_holding);
    }

    /// @notice assigns an existing holding to user
    function _assignHolding(address user) private returns (address) {
        if (_isContract(user)) {
            require(_getManager().isContractWhitelisted(user), "1000");
        }
        address holding = availableHoldings[availableHoldingsHead];
        require(isHolding[holding], "1002");
        require(holdingUser[holding] == address(0), "1102");
        require(userHolding[user] == address(0), "1101");
        availableHoldingsHead += 1;

        userHolding[user] = holding;
        holdingUser[holding] = user;
        emit HoldingAssigned(holding, holdingMinter[holding], user);
        return holding;
    }

    /// @notice checks if address is a contract
    function _isContract(address addr) private view returns (bool) {
        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            size := extcodesize(addr) // Note: returns 0 if called from constructor though
        }
        return size > 0;
    }

    /// @dev method used to force withdraw from strategies; if holding has enough balance, strategies are ignored
    function _retrieveCollateral(
        address _token,
        address _holding,
        uint256 _amount,
        address[] calldata _strategies, //strategies to withdraw from
        bytes[] calldata _data
    ) private {
        if (IERC20(_token).balanceOf(_holding) >= _amount) {
            return; //nothing to do; holding already has the necessary balance
        }
        require(_strategies.length > 0, "3025");
        require(_strategies.length == _data.length, "3026");

        for (uint256 i = 0; i < _strategies.length; i++) {
            (, uint256 _shares) = (
                IStrategy(_strategies[i]).recipients(_holding)
            );
            (uint256 withdrawResult, ) = _getStrategyManager().claimInvestment(
                _holding,
                _strategies[i],
                _shares,
                _token,
                _data[i]
            );

            require(withdrawResult > 0, string(abi.encodePacked("3015;", i)));
            emit CollateralRetrieved(_token, _holding, _strategies[i], _shares);
        }

        require(IERC20(_token).balanceOf(_holding) >= _amount, "2002");
    }

    /// @notice moves and fixes colletarl if requested
    function _moveCollateral(
        address _liquidatedHolding,
        address _token,
        address _holdingTo,
        uint256 _amount,
        bool _fixCollateralOnManager
    ) private {
        IHolding(_liquidatedHolding).transfer(_token, _holdingTo, _amount);
        emit CollateralMoved(_token, _liquidatedHolding, _holdingTo, _amount);

        //if accepted loss >0, the ShareRegistry total collateral for `_holdingTo` needs to be decreased by loss
        if (_fixCollateralOnManager) {
            (, address shareRegistry) = _getStablesManager().shareRegistryInfo(
                _token
            );
            ISharesRegistry reg = ISharesRegistry(shareRegistry);

            _getStablesManager().removeCollateral(
                _holdingTo,
                _token,
                reg.collateral(_holdingTo) - _amount
            );
        }
    }

    function _getManager() private view returns (IManager) {
        return IManager(managerContainer.manager());
    }

    function _getStablesManager() private view returns (IStablesManager) {
        return IStablesManager(_getManager().stablesManager());
    }

    function _getStrategyManager() private view returns (IStrategyManager) {
        return IStrategyManager(_getManager().strategyManager());
    }

    // -- modifiers --
    modifier validAddress(address _address) {
        require(_address != address(0), "3000");
        _;
    }

    modifier validHolding(address _holding) {
        require(isHolding[_holding], "3002");
        _;
    }

    modifier onlyHoldingUser(address _holding) {
        require(holdingUser[_holding] == msg.sender, "1001");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "2001");
        _;
    }

    modifier validToken(address _token) {
        require(_getManager().isTokenWhitelisted(_token), "3001");
        _;
    }

    modifier notPaused() {
        require(!paused, "1200");
        _;
    }
}
