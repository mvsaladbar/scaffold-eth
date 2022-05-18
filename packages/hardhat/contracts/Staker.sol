// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/core/IStaker.sol";

import "./libraries/OperationsLib.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Staking and reward distribution contract based on synthetix
/// @author Cosmin Grigore (@gcosmintech)
contract Staker is IStaker, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice returns staking token
    address public immutable override tokenIn;

    /// @notice returns reward token
    address public immutable override rewardToken;

    /// @notice when current reward distribution ends
    uint256 public override periodFinish = 0;

    /// @notice rewards per second
    uint256 public override rewardRate = 0;

    /// @notice reward period
    uint256 public override rewardsDuration = 365 days;

    /// @notice last reward update timestamp
    uint256 public override lastUpdateTime;

    /// @notice reward-token share
    uint256 public override rewardPerTokenStored;

    /// @notice rewards paid to participants so far
    mapping(address => uint256) public override userRewardPerTokenPaid;

    /// @notice accrued rewards per participant
    mapping(address => uint256) public override rewards;

    /// @notice returns the pause state of the contract
    bool public override paused;

    /// @notice returns the fee address
    address public override feeAddress;

    /// @notice returns the default performance fee
    uint256 public override performanceFee = 100; //1%

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    /// @notice creates a new Staker contract
    /// @param _tokenIn staking token address
    /// @param _rewardToken reward token address
    /// @param _performanceFee performance fee value
    constructor(
        address _tokenIn,
        address _rewardToken,
        uint256 _performanceFee
    ) validAddress(_tokenIn) validAddress(_rewardToken) {
        tokenIn = _tokenIn;
        rewardToken = _rewardToken;
        periodFinish = block.timestamp + 365 days;
        performanceFee = _performanceFee;
    }

    // -- Owner specific methods --
    /// @notice Sets the fee address
    /// @param _val The address of the receiver.
    function setFeeAddress(address _val) external onlyOwner validAddress(_val) {
        emit FeeAddressUpdated(feeAddress, _val);
        feeAddress = _val;
    }

    /// @notice sets the performance fee
    /// @dev should be less than FEE_FACTOR
    /// @param _fee fee amount
    function setPerformanceFee(uint256 _fee)
        external
        onlyOwner
        validAmount(_fee)
    {
        require(_fee < OperationsLib.FEE_FACTOR, "3018");
        emit PerformanceFeeUpdated(performanceFee, _fee);
        performanceFee = _fee;
    }

    /// @notice sets a new value for pause state
    /// @param _val the new value
    function setPaused(bool _val) external onlyOwner {
        emit PauseUpdated(paused, _val);
        paused = _val;
    }

    /// @notice saves tokens from contract
    /// @dev token has to be different than the staking one
    /// @param _token token's address
    /// @param _amount amount to be saved
    function emergencySave(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(tokenIn), "3001");
        IERC20(_token).safeTransfer(owner(), _amount);
        emit SavedFunds(_token, _amount);
    }

    /// @notice sets the new rewards duration
    /// @param _rewardsDuration amount
    function setRewardsDuration(uint256 _rewardsDuration) external onlyOwner {
        rewardsDuration = _rewardsDuration;
        emit RewardsDurationUpdated(rewardsDuration);
    }

    /// @notice adds more rewards to the contract
    /// @param _amount new rewards amount
    function addRewards(uint256 _amount)
        external
        onlyOwner
        updateReward(address(0))
    {
        require(rewardsDuration > 0, "2001");
        if (block.timestamp >= periodFinish) {
            rewardRate = _amount / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (_amount + leftover) / rewardsDuration;
        }

        // prevent overflows
        uint256 balance = IERC20(rewardToken).balanceOf(address(this));
        require(rewardRate <= (balance / rewardsDuration), "2003");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;
        emit RewardAdded(_amount);
    }

    // -- View type methods --
    /// @notice returns the total tokenIn supply
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /// @notice returns total invested amount for an account
    /// @param _account participant address
    function balanceOf(address _account)
        external
        view
        override
        returns (uint256)
    {
        return _balances[_account];
    }

    /// @notice returns the last time rewards were applicable
    function lastTimeRewardApplicable() public view override returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /// @notice returns rewards per tokenIn
    function rewardPerToken() public view override returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return
            rewardPerTokenStored +
            (((lastTimeRewardApplicable() - lastUpdateTime) *
                rewardRate *
                1e18) / _totalSupply);
    }

    /// @notice rewards accrued rewards for account
    /// @param _account participant's address
    function earned(address _account) public view override returns (uint256) {
        return
            ((_balances[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    /// @notice returns reward amount for a specific time range
    function getRewardForDuration() external view override returns (uint256) {
        return rewardRate * rewardsDuration;
    }

    // -- User write type methods --

    /// @notice performs a deposit operation for msg.sender
    /// @dev updates participants rewards
    /// @param _amount deposited amount
    function deposit(uint256 _amount)
        external
        override
        nonReentrant
        updateReward(msg.sender)
    {
        require(_amount > 0, "2001");
        require(!paused, "1200");

        uint256 rewardBalance = IERC20(rewardToken).balanceOf(address(this));
        require(rewardBalance > 0, "2100");

        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    /// @notice claims investment from strategy
    /// @dev updates participants rewards
    /// @param _amount amount to withdraw
    function withdraw(uint256 _amount)
        public
        override
        nonReentrant
        updateReward(msg.sender)
    {
        require(_amount > 0, "2001");
        _totalSupply -= _amount;
        _balances[msg.sender] = _balances[msg.sender] - _amount;
        IERC20(tokenIn).safeTransfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    /// @notice claims the rewards for msg.sender
    function claimRewards()
        public
        override
        nonReentrant
        updateReward(msg.sender)
    {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            uint256 fee = OperationsLib.getFeeAbsolute(reward, performanceFee);
            if (fee > 0) {
                IERC20(rewardToken).safeTransfer(feeAddress, fee);

                emit FeeTaken(rewardToken, feeAddress, fee);
                reward -= fee;
            }

            rewards[msg.sender] = 0;
            IERC20(rewardToken).safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    /// @notice withdraws the entire investment and claims rewards for msg.sender
    function exit() external override {
        withdraw(_balances[msg.sender]);
        claimRewards();
    }

    // -- Modifiers --
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    modifier validAddress(address _address) {
        require(_address != address(0), "3000");
        _;
    }
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "2001");
        _;
    }
}
