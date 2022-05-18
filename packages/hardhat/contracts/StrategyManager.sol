// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/OperationsLib.sol";

import "./interfaces/core/IHolding.sol";
import "./interfaces/core/IManager.sol";
import "./interfaces/core/IStrategy.sol";
import "./interfaces/core/IHoldingManager.sol";
import "./interfaces/core/IStablesManager.sol";
import "./interfaces/core/IStrategyManager.sol";
import "./interfaces/stablecoin/ISharesRegistry.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title StrategyManager contract
/// @author Cosmin Grigore (@gcosmintech)
contract StrategyManager is IStrategyManager, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice returns whitelisted strategies info
    mapping(address => StrategyInfo) public override strategyInfo;

    /// @notice returns the pause state of the contract
    bool public override paused;

    /// @notice contract that contains the address of the manager contract
    IManagerContainer public immutable override managerContainer;

    /// @notice creates a new StrategyManager contract
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

    /// @notice adds a new strategy to the whitelist
    /// @param _strategy strategy's address
    function addStrategy(address _strategy)
        external
        override
        onlyOwner
        validAddress(_strategy)
    {
        require(!strategyInfo[_strategy].whitelisted, "3014");
        StrategyInfo memory info;
        info.performanceFee = _getManager().performanceFee();
        info.active = true;
        info.whitelisted = true;

        strategyInfo[_strategy] = info;

        emit StrategyAdded(_strategy);
    }

    /// @notice removes a strategy from the whitelist
    /// @param _strategy strategy's address
    function removeStrategy(address _strategy)
        external
        override
        onlyOwner
        validStrategy(_strategy)
    {
        strategyInfo[_strategy].whitelisted = false;
        strategyInfo[_strategy].active = false;
        emit StrategyRemoved(_strategy);
    }

    /// @notice updates an existing strategy info
    /// @param _strategy strategy's address
    /// @param _info info
    function updateStrategy(address _strategy, StrategyInfo calldata _info)
        external
        override
        onlyOwner
        validStrategy(_strategy)
    {
        require(strategyInfo[_strategy].whitelisted, "3060");
        strategyInfo[_strategy] = _info;
        emit StrategyUpdated(_strategy, _info.active, _info.performanceFee);
    }

    // -- User specific methods --

    /// @notice invests token into one of the whitelisted strategies
    /// @dev some strategies won't give back any receipt tokens; in this case 'tokenOutAmount' will be 0
    /// @dev 'tokenInAmount' will be equal to '_amount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _token token's address
    /// @param _strategy strategy's address
    /// @param _amount token's amount
    /// @param _data extra data
    /// @return tokenOutAmount returned receipt tokens amount
    /// @return tokenInAmount returned token in amount
    function invest(
        address _token,
        address _strategy,
        uint256 _amount,
        bytes calldata _data
    )
        external
        override
        validStrategy(_strategy)
        validAmount(_amount)
        validToken(_token)
        notPaused
        nonReentrant
        returns (uint256 tokenOutAmount, uint256 tokenInAmount)
    {
        address _holding = _getHoldingManager().userHolding(msg.sender);
        require(_getHoldingManager().isHolding(_holding), "3002");
        require(strategyInfo[_strategy].active, "1202");

        (tokenOutAmount, tokenInAmount) = _invest(
            _holding,
            _token,
            _strategy,
            _amount,
            _data
        );

        emit Invested(
            _holding,
            msg.sender,
            _token,
            _strategy,
            _amount,
            tokenOutAmount,
            tokenInAmount
        );
        return (tokenOutAmount, tokenInAmount);
    }

    /// @notice claims investment from one strategy and invests it into another
    /// @dev callable by holding's user
    /// @dev some strategies won't give back any receipt tokens; in this case 'tokenOutAmount' will be 0
    /// @dev 'tokenInAmount' will be equal to '_amount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _token token's address
    /// @param _data MoveInvestmentData object
    /// @return tokenOutAmount returned receipt tokens amount
    /// @return tokenInAmount returned token in amount
    function moveInvestment(address _token, MoveInvestmentData calldata _data)
        external
        override
        validStrategy(_data.strategyFrom)
        validStrategy(_data.strategyTo)
        nonReentrant
        notPaused
        returns (uint256 tokenOutAmount, uint256 tokenInAmount)
    {
        address _holding = _getHoldingManager().userHolding(msg.sender);
        require(_getHoldingManager().isHolding(_holding), "3002");

        require(strategyInfo[_data.strategyTo].active, "1202");

        (uint256 claimResult, ) = _claimInvestment(
            _holding,
            _data.strategyFrom,
            _data.shares,
            _token,
            _data.dataFrom
        );
        require(claimResult > 0, "3015");

        (tokenOutAmount, tokenInAmount) = _invest(
            _holding,
            _token,
            _data.strategyTo,
            claimResult,
            _data.dataTo
        );

        emit InvestmentMoved(
            _holding,
            msg.sender,
            _token,
            _data.strategyFrom,
            _data.strategyTo,
            _data.shares,
            tokenOutAmount,
            tokenInAmount
        );

        return (tokenOutAmount, tokenInAmount);
    }

    /// @notice claims a strategy investment
    /// @dev withdraws investment from a strategy
    /// @dev some strategies will allow only the tokenIn to be withdrawn
    /// @dev 'assetAmount' will be equal to 'tokenInAmount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _holding holding's address
    /// @param _strategy strategy to invest into
    /// @param _shares shares amount
    /// @param _asset token address to be received
    /// @param _data extra data
    /// @return assetAmount returned asset amount obtained from the operation
    /// @return tokenInAmount returned token in amount
    function claimInvestment(
        address _holding,
        address _strategy,
        uint256 _shares,
        address _asset,
        bytes calldata _data
    )
        external
        override
        validStrategy(_strategy)
        onlyHoldingUserOrHoldingManager(_holding)
        validAmount(_shares)
        nonReentrant
        notPaused
        returns (uint256 assetAmount, uint256 tokenInAmount)
    {
        require(_getHoldingManager().isHolding(_holding), "3002");

        (assetAmount, tokenInAmount) = _claimInvestment(
            _holding,
            _strategy,
            _shares,
            _asset,
            _data
        );

        emit StrategyClaim(
            _holding,
            msg.sender,
            _asset,
            _strategy,
            _shares,
            assetAmount,
            tokenInAmount
        );
    }

    /// @notice claims rewards from strategy
    /// @param _strategy strategy to invest into
    /// @param _data extra data
    /// @return rewards reward amounts
    /// @return tokens reward tokens
    function claimRewards(address _strategy, bytes calldata _data)
        external
        override
        validStrategy(_strategy)
        nonReentrant
        notPaused
        returns (uint256[] memory rewards, address[] memory tokens)
    {
        address _holding = _getHoldingManager().userHolding(msg.sender);
        require(_getHoldingManager().isHolding(_holding), "3002");

        (rewards, tokens) = IStrategy(_strategy).claimRewards(_holding, _data);

        for (uint256 i = 0; i < rewards.length; i++) {
            _accrueRewards(tokens[i], rewards[i], _holding);
        }
    }

    // -- Private type methods --
    /// @notice registers rewards as collateral
    function _accrueRewards(
        address _token,
        uint256 _amount,
        address _holding
    ) private {
        if (_amount > 0) {
            (, address shareRegistry) = _getStablesManager().shareRegistryInfo(
                _token
            );

            if (shareRegistry != address(0)) {
                //add collateral
                _getStablesManager().addCollateral(_holding, _token, _amount);
                emit CollateralAdjusted(_holding, _token, _amount, true);
            }
        }
    }

    /// @notice invests into a strategy
    function _invest(
        address _holding,
        address _token,
        address _strategy,
        uint256 _amount,
        bytes calldata _data
    ) private returns (uint256 tokenOutAmount, uint256 tokenInAmont) {
        (tokenOutAmount, tokenInAmont) = IStrategy(_strategy).deposit(
            _token,
            _amount,
            _holding,
            _data
        );
        require(tokenOutAmount > 0, "3030");

        address _strategyStakingToken = IStrategy(_strategy).tokenIn();
        if (_token != _strategyStakingToken) {
            _getStablesManager().migrateDataToRegistry(
                _holding,
                _token,
                _strategyStakingToken,
                _amount,
                tokenInAmont
            );
        }
    }

    /// @notice withdraws invested amount from a strategy
    function _claimInvestment(
        address _holding,
        address _strategy,
        uint256 _shares,
        address _asset,
        bytes calldata _data
    ) private returns (uint256, uint256) {
        (uint256 assetResult, uint256 tokenInResult) = IStrategy(_strategy)
            .withdraw(_shares, _holding, _asset, _data);
        require(assetResult > 0, "3016");

        // Some strategies will give rewards in the same token; we need to substract from collateral if there are any losses or add if there are any gains
        _getStablesManager().migrateDataToRegistry(
            _holding,
            IStrategy(_strategy).tokenIn(),
            _asset,
            tokenInResult,
            assetResult
        );

        return (assetResult, tokenInResult);
    }

    function _getManager() private view returns (IManager) {
        return IManager(managerContainer.manager());
    }

    function _getHoldingManager() private view returns (IHoldingManager) {
        return IHoldingManager(_getManager().holdingManager());
    }

    function _getStablesManager() private view returns (IStablesManager) {
        return IStablesManager(_getManager().stablesManager());
    }

    // -- modifiers --
    modifier validAddress(address _address) {
        require(_address != address(0), "3000");
        _;
    }

    modifier validStrategy(address _strategy) {
        require(strategyInfo[_strategy].whitelisted, "3029");
        _;
    }

    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "2001");
        _;
    }

    modifier onlyHoldingUserOrHoldingManager(address _holding) {
        require(
            _getManager().holdingManager() == msg.sender ||
                _getHoldingManager().holdingUser(_holding) == msg.sender,
            "1000"
        );
        _;
    }

    modifier onlyHoldingUser(address _holding) {
        require(
            _getHoldingManager().holdingUser(_holding) == msg.sender,
            "1001"
        );
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
