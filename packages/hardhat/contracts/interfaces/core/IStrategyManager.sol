// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IManagerContainer.sol";
import "./IStrategyManagerMin.sol";

/// @title Interface for the Strategy Manager contract
/// @author Cosmin Grigore (@gcosmintech)
interface IStrategyManager is IStrategyManagerMin {
    /// @notice emitted when a new strategy is added to the whitelist
    event StrategyAdded(address indexed strategy);

    /// @notice emitted when an existing strategy is removed from the whitelist
    event StrategyRemoved(address indexed strategy);

    /// @notice emitted when an existing strategy info is updated
    event StrategyUpdated(address indexed strategy, bool active, uint256 fee);

    /// @notice emitted when an investment is created
    event Invested(
        address indexed holding,
        address indexed user,
        address indexed token,
        address strategy,
        uint256 amount,
        uint256 tokenOutResult,
        uint256 tokenInResult
    );

    /// @notice emitted when an investment is withdrawn
    event InvestmentMoved(
        address indexed holding,
        address indexed user,
        address indexed token,
        address strategyFrom,
        address strategyTo,
        uint256 shares,
        uint256 tokenOutResult,
        uint256 tokenInResult
    );

    /// @notice event emitted when collateral is adjusted from a claim investment or claim rewards operation
    event CollateralAdjusted(
        address indexed holding,
        address indexed token,
        uint256 value,
        bool add
    );

    /// @notice emitted when an investment is withdrawn
    event StrategyClaim(
        address indexed holding,
        address indexed user,
        address indexed token,
        address strategy,
        uint256 shares,
        uint256 tokenAmount,
        uint256 tokenInAmount
    );

    /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );

    /// @notice event emitted when rewards are claimed
    event RewardsClaimed(
        address indexed token,
        address indexed holding,
        uint256 amount
    );

    /// @notice event emitted when pause state is changed
    event PauseUpdated(bool oldVal, bool newVal);

    /// @notice information about strategies
    struct StrategyInfo {
        uint256 performanceFee;
        bool active;
        bool whitelisted;
    }

    /// @notice data used for a move investment operation
    /// @param _strategyTo strategy's address to invest
    /// @param _shares shares amount
    /// @param _dataFrom extra data for claimInvestment
    /// @param _dataTo extra data for invest
    struct MoveInvestmentData {
        address strategyFrom;
        address strategyTo;
        uint256 shares;
        bytes dataFrom;
        bytes dataTo;
    }

    /// @notice interface of the manager container contract
    function managerContainer() external view returns (IManagerContainer);

    /// @notice returns the pause state of the contract
    function paused() external view returns (bool);

    /// @notice sets a new value for pause state
    /// @param _val the new value
    function setPaused(bool _val) external;

    /// @notice returns whitelisted strategies
    function strategyInfo(address _strategy)
        external
        view
        override
        returns (
            uint256,
            bool,
            bool
        );

    /// @notice adds a new strategy to the whitelist
    /// @param _strategy strategy's address
    function addStrategy(address _strategy) external;

    /// @notice removes a strategy from the whitelist
    /// @param _strategy strategy's address
    function removeStrategy(address _strategy) external;

    /// @notice updates an existing strategy info
    /// @param _strategy strategy's address
    /// @param _info info
    function updateStrategy(address _strategy, StrategyInfo calldata _info)
        external;

    // -- User specific methods --
    /// @notice invests in a strategy
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
    ) external returns (uint256 tokenOutAmount, uint256 tokenInAmount);

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
        returns (uint256 tokenOutAmount, uint256 tokenInAmount);

    /// @notice claims a strategy investment
    /// @dev withdraws investment from a strategy
    /// @dev some strategies will allow only the tokenIn to be withdrawn
    /// @dev 'assetAmount' will be equal to 'tokenInAmount' in case the '_asset' is the same as strategy 'tokenIn()'
    /// @param _holding holding's address
    /// @param _strategy strategy to invest into
    /// @param _shares shares amount
    /// @param _asset token address to be received
    /// @param _data extra data
    /// @return assetAmount returned asset amoumt obtained from the operation
    /// @return tokenInAmount returned token in amount
    function claimInvestment(
        address _holding,
        address _strategy,
        uint256 _shares,
        address _asset,
        bytes calldata _data
    ) external returns (uint256 assetAmount, uint256 tokenInAmount);

    /// @notice claim rewards from strategy
    /// @param _strategy strategy's address
    /// @param _data extra data
    /// @return amounts reward amounts
    /// @return tokens reward tokens
    function claimRewards(address _strategy, bytes calldata _data)
        external
        returns (uint256[] memory amounts, address[] memory tokens);
}
