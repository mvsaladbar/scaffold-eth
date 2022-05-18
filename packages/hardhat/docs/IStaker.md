# IStaker

*Cosmin Grigore (@gcosmintech)*

> Interface for Staker contract





## Methods

### balanceOf

```solidity
function balanceOf(address _account) external view returns (uint256)
```

returns total invested amount for an account



#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | participant address

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### claimRewards

```solidity
function claimRewards() external nonpayable
```

claims the rewards for msg.sender




### deposit

```solidity
function deposit(uint256 _amount) external nonpayable
```

performs a deposit operation for msg.sender

*updates participants rewards*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | deposited amount

### earned

```solidity
function earned(address _account) external view returns (uint256)
```

rewards accrued rewards for account



#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | participant&#39;s address

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### exit

```solidity
function exit() external nonpayable
```

withdraws the entire investment and claims rewards for msg.sender




### feeAddress

```solidity
function feeAddress() external view returns (address)
```

returns the fee address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### getRewardForDuration

```solidity
function getRewardForDuration() external view returns (uint256)
```

returns reward amount for a specific time range




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### lastTimeRewardApplicable

```solidity
function lastTimeRewardApplicable() external view returns (uint256)
```

returns the last time rewards were applicable




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### lastUpdateTime

```solidity
function lastUpdateTime() external view returns (uint256)
```

last reward update timestamp




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### paused

```solidity
function paused() external view returns (bool)
```

returns the pause state of the contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### performanceFee

```solidity
function performanceFee() external view returns (uint256)
```

returns the default performance fee




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### periodFinish

```solidity
function periodFinish() external view returns (uint256)
```

when current reward distribution ends




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### rewardPerToken

```solidity
function rewardPerToken() external view returns (uint256)
```

returns rewards per tokenIn




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### rewardPerTokenStored

```solidity
function rewardPerTokenStored() external view returns (uint256)
```

reward-token share




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### rewardRate

```solidity
function rewardRate() external view returns (uint256)
```

rewards per second




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### rewardToken

```solidity
function rewardToken() external view returns (address)
```

returns reward token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### rewards

```solidity
function rewards(address participant) external view returns (uint256)
```

accrued rewards per participant



#### Parameters

| Name | Type | Description |
|---|---|---|
| participant | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### rewardsDuration

```solidity
function rewardsDuration() external view returns (uint256)
```

reward period




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### tokenIn

```solidity
function tokenIn() external view returns (address)
```

returns staking token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```

returns the total tokenIn supply




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### userRewardPerTokenPaid

```solidity
function userRewardPerTokenPaid(address participant) external view returns (uint256)
```

rewards paid to participants so far



#### Parameters

| Name | Type | Description |
|---|---|---|
| participant | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### withdraw

```solidity
function withdraw(uint256 _amount) external nonpayable
```

claims investment from strategy

*updates participants rewards*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | amount to withdraw



## Events

### FeeAddressUpdated

```solidity
event FeeAddressUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the fee address is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### FeeTaken

```solidity
event FeeTaken(address indexed token, address indexed feeAddress, uint256 amount)
```

event emitted when performance fee is taken



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| feeAddress `indexed` | address | undefined |
| amount  | uint256 | undefined |

### PauseUpdated

```solidity
event PauseUpdated(bool oldVal, bool newVal)
```

event emitted when pause state is modified



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldVal  | bool | undefined |
| newVal  | bool | undefined |

### PerformanceFeeUpdated

```solidity
event PerformanceFeeUpdated(uint256 indexed oldFee, uint256 indexed newFee)
```

emitted when the default fee is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldFee `indexed` | uint256 | undefined |
| newFee `indexed` | uint256 | undefined |

### RewardAdded

```solidity
event RewardAdded(uint256 reward)
```

event emitted when rewards were added



#### Parameters

| Name | Type | Description |
|---|---|---|
| reward  | uint256 | undefined |

### RewardPaid

```solidity
event RewardPaid(address indexed user, uint256 reward)
```

event emitted when participant claimed rewards



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| reward  | uint256 | undefined |

### RewardsDurationUpdated

```solidity
event RewardsDurationUpdated(uint256 newDuration)
```

event emitted when rewards duration was updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| newDuration  | uint256 | undefined |

### SavedFunds

```solidity
event SavedFunds(address indexed token, uint256 amount)
```

event emitted when tokens, other than the staking one, are saved from the contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Staked

```solidity
event Staked(address indexed user, uint256 amount)
```

event emitted when participant deposited



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Withdrawn

```solidity
event Withdrawn(address indexed user, uint256 amount)
```

event emitted when participant claimed the investment



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| amount  | uint256 | undefined |



