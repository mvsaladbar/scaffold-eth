// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../libraries/RebaseLib.sol";

import "./IManagerContainer.sol";
import "../stablecoin/IPandoraUSD.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Interface for stables manager
/// @author Cosmin Grigore (@gcosmintech)
interface IStablesManager {
    /// @notice event emitted when collateral was registered
    event AddedCollateral(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    /// @notice event emitted when collateral was registered by the owner
    event ForceAddedCollateral(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    /// @notice event emitted when collateral was unregistered
    event RemovedCollateral(
        address indexed user,
        address indexed token,
        uint256 amount
    );

    /// @notice event emitted when collateral was unregistered by the owner
    event ForceRemovedCollateral(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    /// @notice event emitted when a borrow action was performed
    event Borrowed(
        address indexed user,
        uint256 amount,
        uint256 part,
        bool mintToUser
    );
    /// @notice event emitted when a repay action was performed
    event Repayed(
        address indexed user,
        uint256 amount,
        uint256 part,
        bool repayFromUser,
        bool selfLiquidation
    );

    /// @notice event emitted when a registry is added
    event RegistryAdded(address indexed token, address indexed registry);

    /// @notice event emitted when a registry is updated
    event RegistryUpdated(address indexed token, address indexed registry);

    /// @notice event emmitted when a liquidation operation happened
    event Liquidated(
        address indexed liquidatedUser,
        address indexed liquidatingUser,
        address indexed token,
        uint256 obtainedCollateral,
        uint256 protocolCollateral,
        uint256 liquidatedAmount
    );

    /// @notice event emitted when data is migrated to another collateral token
    event CollateralMigrated(
        address indexed holding,
        address indexed tokenFrom,
        address indexed tokenTo,
        uint256 borrowedAmount,
        uint256 borrowedShares,
        uint256 collateralTo
    );

    /// @notice emitted when an existing strategy info is updated
    event RegistryConfigUpdated(address indexed registry, bool active);

    struct ShareRegistryInfo {
        bool active;
        address deployedAt;
    }

    /// @notice event emitted when pause state is changed
    event PauseUpdated(bool oldVal, bool newVal);

    /// @notice emitted when the PandoraUSD address is updated
    event StableAddressUpdated(address indexed _old, address indexed _new);

    /// @notice returns the pause state of the contract
    function paused() external view returns (bool);

    /// @notice sets a new value for pause state
    /// @param _val the new value
    function setPaused(bool _val) external;

    /// @notice returns collateral amount
    /// @param _token collateral token
    /// @param _amount stablecoin amount
    function computeNeededCollateral(address _token, uint256 _amount)
        external
        view
        returns (uint256 result);

    /// @notice sets the PandoraUSD address
    /// @param _newAddr contract's address
    function setPandoraUSD(address _newAddr) external;

    /// @notice share -> info
    function shareRegistryInfo(address _registry)
        external
        view
        returns (bool, address);

    /// @notice total borrow per token
    function totalBorrowed(address _token)
        external
        view
        returns (uint128 elastic, uint128 base);

    /// @notice returns totals, base and elastic
    function totals(IERC20 token) external view returns (uint128, uint128);

    /// @notice interface of the manager container contract
    function managerContainer() external view returns (IManagerContainer);

    /// @notice Pandora project stablecoin address
    function pandoraUSD() external view returns (IPandoraUSD);

    /// @notice Returns amount to share transformation
    /// @param _token token for which the exchange is done
    /// @param _amount token's amount
    /// @param _roundUp if the resulted shares are rounded up
    /// @return _share obtained shares
    function toShare(
        IERC20 _token,
        uint256 _amount,
        bool _roundUp
    ) external view returns (uint256 _share);

    /// @dev Returns share to amount transformation
    /// @param _token token for which the exchange is done
    /// @param _share amount of shares
    /// @param _roundUp if the resulted amount is rounded up
    /// @return _amount obtained amount
    function toAmount(
        IERC20 _token,
        uint256 _share,
        bool _roundUp
    ) external view returns (uint256 _amount);

    /// @notice Returns true if user is solvent for the specified token
    /// @param _token the token for which the check is done
    /// @param _holding the user address
    /// @return true/false
    function isSolvent(address _token, address _holding)
        external
        view
        returns (bool);

    /// @notice get liquidation info for holding and token
    /// @dev returns borrowed amount, collateral amount, collateral's value ratio, current borrow ratio, solvency status; colRatio needs to be >= borrowRaio
    /// @param _holding address of the holding to check for
    /// @param _token address of the token to check for
    function getLiquidationInfo(address _holding, address _token)
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256,
            bool
        );

    /// @notice migrates collateral and share to a new registry
    /// @param _holding the holding for which collateral is added
    /// @param _tokenFrom collateral token source
    /// @param _tokenTo collateral token destination
    /// @param _collateralFrom collateral amount to be removed from source
    /// @param _collateralTo collateral amount to be added to destination
    function migrateDataToRegistry(
        address _holding,
        address _tokenFrom,
        address _tokenTo,
        uint256 _collateralFrom,
        uint256 _collateralTo
    ) external;

    /// @notice accrues collateral for holding
    /// @dev callable by the owner
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function forceAddCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external;

    /// @notice registers new collateral
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function addCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external;

    /// @notice removes collateral for holding
    /// @dev callable by the owner
    /// @param _holding the holding for which collateral is removed
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function forceRemoveCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external;

    /// @notice unregisters collateral
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount amount of collateral
    function removeCollateral(
        address _holding,
        address _token,
        uint256 _amount
    ) external;

    /// @notice mints stablecoin to the user
    /// @param _holding the holding for which collateral is added
    /// @param _token collateral token
    /// @param _amount the borrowed amount
    function borrow(
        address _holding,
        address _token,
        uint256 _amount,
        bool _mintDirectlyToUser
    )
        external
        returns (
            uint256 part,
            uint256 share,
            uint256 feeAmount
        );

    /// @notice registers a repay operation
    /// @param _holding the holding for which repay is performed
    /// @param _token collateral token
    /// @param _part the repayed amount
    /// @param _repayFromUser if true it will burn from user's wallet, otherwise from user's holding
    /// @param _selfLiquidation if true, nothing is burned
    function repay(
        address _holding,
        address _token,
        uint256 _part,
        bool _repayFromUser,
        bool _selfLiquidation
    ) external returns (uint256 amount);

    /// @notice registers a liquidation event
    /// @dev if user is solvent, there's no need for liqudation;
    /// @param _liquidatedHolding address of the holding which is being liquidated
    /// @param _token collateral token
    /// @param _holdingTo address of the holding which initiated the liquidation
    /// @param _burnFromUser if true, burns stablecoin from the liquidating user, not from the holding
    /// @return result true if liquidation happened
    /// @return collateralAmount the amount of collateral to move
    /// @return protocolFeeAmount the protocol fee amount
    function liquidate(
        address _liquidatedHolding,
        address _token,
        address _holdingTo,
        bool _burnFromUser
    )
        external
        returns (
            bool,
            uint256,
            uint256
        );
}
