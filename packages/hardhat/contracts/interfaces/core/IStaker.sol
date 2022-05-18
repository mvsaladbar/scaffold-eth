// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for Staker contract
/// @author Cosmin Grigore (@gcosmintech)
interface IStaker {
    /// @notice event emitted when pause state is modified
    event PauseUpdated(bool oldVal, bool newVal);
    /// @notice event emitted when tokens, other than the staking one, are saved from the contract
    event SavedFunds(address indexed token, uint256 amount);
    /// @notice event emitted when rewards duration was updated
    event RewardsDurationUpdated(uint256 newDuration);
    /// @notice event emitted when rewards were added
    event RewardAdded(uint256 reward);
    /// @notice event emitted when participant deposited
    event Staked(address indexed user, uint256 amount);
    /// @notice event emitted when participant claimed the investment
    event Withdrawn(address indexed user, uint256 amount);
    /// @notice event emitted when participant claimed rewards
    event RewardPaid(address indexed user, uint256 reward);
    /// @notice emitted when the fee address is changed
    event FeeAddressUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );
     /// @notice event emitted when performance fee is taken
    event FeeTaken(
        address indexed token,
        address indexed feeAddress,
        uint256 amount
    );
     /// @notice emitted when the default fee is updated
    event PerformanceFeeUpdated(uint256 indexed oldFee, uint256 indexed newFee);

    /// @notice returns staking token
    function tokenIn() external view returns (address);

    /// @notice returns reward token
    function rewardToken() external view returns (address);

    /// @notice returns the fee address
    function feeAddress() external view returns (address);

    /// @notice when current reward distribution ends
    function periodFinish() external view returns (uint256);

    /// @notice rewards per second
    function rewardRate() external view returns (uint256);

    /// @notice reward period
    function rewardsDuration() external view returns (uint256);

    /// @notice last reward update timestamp
    function lastUpdateTime() external view returns (uint256);

    /// @notice reward-token share
    function rewardPerTokenStored() external view returns (uint256);

    /// @notice returns the pause state of the contract
    function paused() external view returns (bool);

    /// @notice rewards paid to participants so far
    function userRewardPerTokenPaid(address participant)
        external
        view
        returns (uint256);

    /// @notice accrued rewards per participant
    function rewards(address participant) external view returns (uint256);

    /// @notice returns the total tokenIn supply
    function totalSupply() external view returns (uint256);

    /// @notice returns total invested amount for an account
    /// @param _account participant address
    function balanceOf(address _account) external view returns (uint256);

    /// @notice returns the last time rewards were applicable
    function lastTimeRewardApplicable() external view returns (uint256);

    /// @notice returns rewards per tokenIn
    function rewardPerToken() external view returns (uint256);

    /// @notice returns the default performance fee
    function performanceFee() external view returns (uint256); //1%

    /// @notice rewards accrued rewards for account
    /// @param _account participant's address
    function earned(address _account) external view returns (uint256);

    /// @notice returns reward amount for a specific time range
    function getRewardForDuration() external view returns (uint256);

    /// @notice performs a deposit operation for msg.sender
    /// @dev updates participants rewards
    /// @param _amount deposited amount
    function deposit(uint256 _amount) external;

    /// @notice claims investment from strategy
    /// @dev updates participants rewards
    /// @param _amount amount to withdraw
    function withdraw(uint256 _amount) external;

    /// @notice claims the rewards for msg.sender
    function claimRewards() external;

    /// @notice withdraws the entire investment and claims rewards for msg.sender
    function exit() external;
}
