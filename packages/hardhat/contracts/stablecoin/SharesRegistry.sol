// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/core/IStablesManager.sol";
import "../interfaces/core/IManager.sol";
import "../interfaces/stablecoin/ISharesRegistry.sol";
import "../libraries/RebaseLib.sol";

/// @title SharesRegistry contract
/// @author Cosmin Grigore (@gcosmintech)
contract SharesRegistry is ISharesRegistry {
    using RebaseLib for RebaseLib.Rebase;

    /// @notice borrowed amount for holding; holding > amount
    mapping(address => uint256) public override borrowed;

    /// @notice borrowed shares for holding; holding  > shares
    mapping(address => uint256) public override borrowedShares;

    /// @notice collateralization rate for token
    uint256 public override collateralizationRate;
    /// @notice borrowing fee amount
    uint256 public override borrowOpeningFee;
    /// @notice liquidation multiplier used when liquidated to accrue protocol's fee
    uint256 public override liquidationMultiplier;

    /// @notice the token this registry is for
    address public immutable override token;

    /// @notice current owner
    address public override owner;
    /// @notice possible new owner
    /// @dev if different than `owner` an ownership transfer is in  progress and has to be accepted by the new owner
    address public override temporaryOwner;

    /// @notice contract that contains the address of the manager contract
    IManagerContainer public immutable override managerContainer;

    /// @notice total collateral for Holding, per token (Holding=>collateral amount)
    mapping(address => uint256) public override collateral;

    /// @notice exchange and interest rate tracking
    /// this is 'cached' here because calls to oracles can be very expensive
    uint256 public override exchangeRate;

    /// @notice info about the accrued data
    AccrueInfo public override accrueInfo;

    /// @notice oracle contract associated with this share registry
    IOracle public override oracle;

    /// @notice extra oracle data if needed
    bytes public oracleData;

    /// @notice creates a SharesRegistry for a specific token
    /// @param _owner the owner of the contract
    /// @param _managerContainer contract that contains the address of the manager contract
    /// @param _token the parent token of this contract
    /// @param _oracle the oracle used to retrieve price data for this token
    /// @param _oracleData extra data for the oracle
    /// @param _data extra data used to initialize the contract
    constructor(
        address _owner,
        address _managerContainer,
        address _token,
        address _oracle,
        bytes memory _oracleData,
        bytes memory _data
    ) {
        require(_owner != address(0), "3032");
        require(_token != address(0), "3001");
        require(_oracle != address(0), "3034");
        require(_managerContainer != address(0), "3065");
        require(_data.length > 0, "3060");
        owner = _owner;
        token = _token;
        oracle = IOracle(_oracle);
        oracleData = _oracleData;
        managerContainer = IManagerContainer(_managerContainer);

        (collateralizationRate, liquidationMultiplier, borrowOpeningFee) = abi
            .decode(_data, (uint256, uint256, uint256));
    }

    // -- Owner specific methods --

    /// @notice updates the borrowing opening fee
    /// @param _newVal the new value
    function setBorrowingFee(uint256 _newVal) external onlyOwner {
        emit BorrowingOpeningFeeUpdated(borrowOpeningFee, _newVal);
        borrowOpeningFee = _newVal;
    }

    /// @notice updates the liquidation multiplier
    /// @param _newVal the new value
    function setLiquidationMultiplier(uint256 _newVal) external onlyOwner {
        emit LiquidationMultiplierUpdated(liquidationMultiplier, _newVal);
        liquidationMultiplier = _newVal;
    }

    /// @notice updates the colalteralization rate
    /// @param _newVal the new value
    function setCollateralizationRate(uint256 _newVal) external onlyOwner {
        emit CollateralizationRateUpdated(collateralizationRate, _newVal);
        collateralizationRate = _newVal;
    }

    /// @notice updates the oracle data
    /// @param _oracleData the new data
    function setOracleData(bytes calldata _oracleData) external onlyOwner {
        oracleData = _oracleData;
        emit OracleDataUpdated();
    }

    /// @notice initiates the ownership transferal
    /// @param _newOwner the address of the new owner
    function transferOwnership(address _newOwner) external override onlyOwner {
        require(_newOwner != owner, "3035");
        temporaryOwner = _newOwner;
        emit OwnershipTransferred(owner, _newOwner);
    }

    /// @notice finalizes the ownership transferal process
    /// @dev must be called after `transferOwnership` was executed successfully, by the new temporary onwer
    function acceptOwnership() external override onlyTemporaryOwner {
        owner = msg.sender;
        emit OwnershipAccepted(msg.sender);
    }

    // -- Write type methods --
   
    /// @notice sets a new value for borrowed
    /// @param _holding the address of the user
    /// @param _newVal the new amount
    function setBorrowed(address _holding, uint256 _newVal)
        external
        override
        onlyStableManager
    {
        emit BorrowedSet(_holding, borrowed[_holding], _newVal);
        borrowed[_holding] = _newVal;
    }

    /// @notice sets a new value for borrowedShares
    /// @param _holding the address of the user
    /// @param _newVal the new amount
    function setBorrowedShares(address _holding, uint256 _newVal)
        external
        override
        onlyStableManager
    {
        emit BorrowedSharesSet(_holding, borrowedShares[_holding], _newVal);
        borrowedShares[_holding] = _newVal;
    }

    /// @notice registers collateral for user
    /// @param _holding the address of the user
    /// @param _share the new collateral shares
    function registerCollateral(address _holding, uint256 _share)
        external
        override
        onlyStableManager
    {
        collateral[_holding] += _share;
        emit CollateralAdded(_holding, _share);
    }

    /// @notice registers a collateral removal operation
    /// @param _holding the address of the user
    /// @param _share the new collateral shares
    /// @param _totalBorrowBase total borrow amount
    /// @param _totalBorrowElastic total borrow shares
    function unregisterCollateral(
        address _holding,
        uint256 _share,
        uint256 _totalBorrowBase,
        uint256 _totalBorrowElastic
    ) external override onlyStableManager {
        accrue(_totalBorrowBase, _totalBorrowElastic);
        if (_share > collateral[_holding]) {
            _share = collateral[_holding];
        }
        collateral[_holding] = _share > collateral[_holding]
            ? 0
            : collateral[_holding] - _share;
        emit CollateralRemoved(_holding, _share);
    }

    /// @notice removes collateral share from user
    /// @param _from the address for which the collateral is removed
    /// @param _to the address for which the collateral is added
    /// @param _share share amount
    function updateLiquidatedCollateral(
        address _from,
        address _to,
        uint256 _share
    ) external override onlyStableManager {
        collateral[_from] -= _share;
        emit CollateralRemoved(_from, _share);

        collateral[_to] += _share;
        emit CollateralAdded(_to, _share);
    }

    /// @notice accruees fees for the AccrueInfo object
    /// @param _amount of new fees to be registered
    function accrueFees(uint256 _amount) external override onlyStableManager {
        accrueInfo.feesEarned += uint128(_amount);
        emit FeesAccrued(_amount);
    }

    /// @notice Accrues the interest on the borrowed tokens and handles the accumulation of fees.
    /// @param _totalBorrowBase total borrow amount
    /// @param _totalBorrowElastic total borrow shares
    function accrue(uint256 _totalBorrowBase, uint256 _totalBorrowElastic)
        public
        override
        returns (uint128)
    {
        AccrueInfo memory _accrueInfo = accrueInfo;
        // Number of seconds since accrue was called
        uint256 elapsedTime = block.timestamp - _accrueInfo.lastAccrued;
        if (elapsedTime == 0) {
            return uint128(_totalBorrowElastic);
        }
        _accrueInfo.lastAccrued = uint64(block.timestamp);

        if (_totalBorrowBase == 0) {
            accrueInfo = _accrueInfo;
            return uint128(_totalBorrowElastic);
        }

        // Accrue interest
        uint256 extraAmount = (_totalBorrowElastic *
            _accrueInfo.INTEREST_PER_SECOND *
            elapsedTime) / 1e18;

        _totalBorrowElastic += extraAmount;
        _accrueInfo.feesEarned += uint128(extraAmount);
        accrueInfo = _accrueInfo;

        emit Accrued(_totalBorrowElastic, extraAmount);

        return uint128(_totalBorrowElastic);
    }

    /// @notice Gets the exchange rate. I.e how much collateral to buy 1e18 asset.
    /// This function is supposed to be invoked if needed because Oracle queries can be expensive.
    /// @return updated True if `exchangeRate` was updated.
    /// @return rate The new exchange rate.
    function updateExchangeRate()
        external
        override
        returns (bool updated, uint256 rate)
    {
        (updated, rate) = oracle.get(oracleData);

        if (updated) {
            exchangeRate = rate;
            emit ExchangeRateUpdated(rate);
        } else {
            // Return the old rate if fetching wasn't successful
            rate = exchangeRate;
        }
    }

    modifier onlyStableManager() {
        require(
            msg.sender == IManager(managerContainer.manager()).stablesManager(),
            "1000"
        );
        _;
    }
    modifier onlyOwner() {
        require(msg.sender == owner, "3032");
        _;
    }
    modifier onlyTemporaryOwner() {
        require(msg.sender == temporaryOwner, "1000");
        require(owner != msg.sender, "3020");
        _;
    }
}
