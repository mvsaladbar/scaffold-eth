// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../oracle/IOracle.sol";
import "../core/IManagerContainer.sol";

/// @title Interface for SharesRegistry contract
/// @author Cosmin Grigore (@gcosmintech)
/// @dev based on MIM CauldraonV2 contract
interface ISharesRegistry {
    /// @notice event emitted when contract new ownership is accepted
    event OwnershipAccepted(address indexed newOwner);
    /// @notice event emitted when contract ownership transferal was initated
    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );
    /// @notice event emitted when collateral was registered
    event CollateralAdded(address indexed user, uint256 share);
    /// @notice event emitted when collateral was unregistered
    event CollateralRemoved(address indexed user, uint256 share);
    /// @notice event emitted when exchange rate was updated
    event ExchangeRateUpdated(uint256 rate);
    /// @notice event emitted when the borrowing opening fee is updated
    event BorrowingOpeningFeeUpdated(uint256 oldVal, uint256 newVal);
    /// @notice event emitted when the liquidation mutiplier is updated
    event LiquidationMultiplierUpdated(uint256 oldVal, uint256 newVal);
    /// @notice event emitted when the collateralization rate is updated
    event CollateralizationRateUpdated(uint256 oldVal, uint256 newVal);
    /// @notice event emitted when fees are accrued
    event FeesAccrued(uint256 amount);
    /// @notice event emitted when accrue was called
    event Accrued(uint256 updatedTotalBorrow, uint256 extraAmount);
    /// @notice oracle data updated
    event OracleDataUpdated();
    /// @notice event emitted when borrowed amount is set
    event BorrowedSet(address _holding, uint256 oldVal, uint256 newVal);
    /// @notice event emitted when borrowed shares amount is set
    event BorrowedSharesSet(address _holding, uint256 oldVal, uint256 newVal);

    /// @notice accure info data
    struct AccrueInfo {
        uint64 lastAccrued;
        uint128 feesEarned;
        // solhint-disable-next-line var-name-mixedcase
        uint64 INTEREST_PER_SECOND;
    }

    /// @notice exchange and interest rate tracking
    /// this is 'cached' here because calls to oracles can be very expensive
    function exchangeRate() external view returns (uint256);

    /// @notice borrowed amount for holding; holding > amount
    function borrowed(address _holding) external view returns (uint256);

    /// @notice borrowed shares for holding; holding > amount
    function borrowedShares(address _holding) external view returns (uint256);

    /// @notice info about the accrued data
    function accrueInfo()
        external
        view
        returns (
            uint64,
            uint128,
            uint64
        );

    /// @notice current owner
    function owner() external view returns (address);

    /// @notice possible new owner
    /// @dev if different than `owner` an ownership transfer is in  progress and has to be accepted by the new owner
    function temporaryOwner() external view returns (address);

    /// @notice interface of the manager container contract
    function managerContainer() external view returns (IManagerContainer);

    /// @notice returns the token address for which this registry was created
    function token() external view returns (address);

    /// @notice oracle contract associated with this share registry
    function oracle() external view returns (IOracle);

    /// @notice borrowing fee amount
    // solhint-disable-next-line func-name-mixedcase
    function borrowOpeningFee() external view returns (uint256);

    /// @notice collateralization rate for token
    // solhint-disable-next-line func-name-mixedcase
    function collateralizationRate() external view returns (uint256);

    // solhint-disable-next-line func-name-mixedcase
    function liquidationMultiplier() external view returns (uint256);

    /// @notice returns the collateral shares for user
    /// @param _user the address for which the query is performed
    function collateral(address _user) external view returns (uint256);

    /// @notice sets a new value for borrowed
    /// @param _holding the address of the user
    /// @param _newVal the new amount
    function setBorrowed(address _holding, uint256 _newVal) external;

    /// @notice sets a new value for borrowedShares
    /// @param _holding the address of the user
    /// @param _newVal the new amount
    function setBorrowedShares(address _holding, uint256 _newVal) external;

    /// @notice Gets the exchange rate. I.e how much collateral to buy 1e18 asset.
    /// @return updated True if `exchangeRate` was updated.
    /// @return rate The new exchange rate.
    function updateExchangeRate() external returns (bool updated, uint256 rate);

    /// @notice updates the AccrueInfo object
    /// @param _totalBorrowBase total borrow amount
    /// @param _totalBorrowElastic total borrow shares
    function accrue(uint256 _totalBorrowBase, uint256 _totalBorrowElastic)
        external
        returns (uint128);

    /// @notice removes collateral share from user
    /// @param _from the address for which the collateral is removed
    /// @param _to the address for which the collateral is added
    /// @param _share share amount
    function updateLiquidatedCollateral(
        address _from,
        address _to,
        uint256 _share
    ) external;

    /// @notice udates only the fees part of AccureInfo object
    function accrueFees(uint256 _amount) external;

    /// @notice registers collateral for token
    /// @param _holding the user's address for which collateral is registered
    /// @param _share amount of shares
    function registerCollateral(address _holding, uint256 _share) external;

    /// @notice unregisters collateral for token
    /// @param _holding the user's address for which collateral is registered
    /// @param _share amount of shares
    /// @param _totalBorrowBase total borrow amount
    /// @param _totalBorrowElastic total borrow shares
    function unregisterCollateral(
        address _holding,
        uint256 _share,
        uint256 _totalBorrowBase,
        uint256 _totalBorrowElastic
    ) external;

    /// @notice initiates the ownership transferal
    /// @param _newOwner the address of the new owner
    function transferOwnership(address _newOwner) external;

    /// @notice finalizes the ownership transferal process
    /// @dev must be called after `transferOwnership` was executed successfully, by the new temporary onwer
    function acceptOwnership() external;
}
