# ConvexDaiUsdcUsdtBase

*Cosmin Grigore (@gcosmintech)*

> ConvexDaiUsdcUsdtBase contract used for any Convex cDai+cUsdc+cUsdt strategy





## Methods

### addUnderlying

```solidity
function addUnderlying(address _asset) external nonpayable
```

adds an underlying token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _asset | address | the new address

### convexBaseRewardPool

```solidity
function convexBaseRewardPool() external view returns (contract IConvexBaseRewardPool)
```

convex rewrad pool




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IConvexBaseRewardPool | undefined

### convexBooster

```solidity
function convexBooster() external view returns (contract IConvexBooster)
```

convex booster




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IConvexBooster | undefined

### convexZap

```solidity
function convexZap() external view returns (contract IConvexZap)
```

convex ClaimZap contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IConvexZap | undefined

### emergencySave

```solidity
function emergencySave(address _token, uint256 _amount) external nonpayable
```

save funds



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token address
| _amount | uint256 | token amount

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

contract that contains the address of the manager contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### pid

```solidity
function pid() external view returns (uint256)
```

convex booster pid




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### removeUnderlying

```solidity
function removeUnderlying(address _asset) external nonpayable
```

removes an underlying token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _asset | address | the new address

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setConvexPid

```solidity
function setConvexPid(uint256 _newVal) external nonpayable
```

sets the new value



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newVal | uint256 | the new value

### setConvexZap

```solidity
function setConvexZap(address _newAddr) external nonpayable
```

sets the new value



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newAddr | address | the new address

### totalInvestments

```solidity
function totalInvestments() external view returns (uint256)
```

total investments for the strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined

### whitelistedUnderlyingTokenIn

```solidity
function whitelistedUnderlyingTokenIn(address) external view returns (bool)
```

underlying tokens for obtaining the tokenIn LP one



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined



## Events

### ConvexBoosterUpdated

```solidity
event ConvexBoosterUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### ConvexPidUpdated

```solidity
event ConvexPidUpdated(uint256 _old, uint256 _new)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _old  | uint256 | undefined |
| _new  | uint256 | undefined |

### ConvexRewardPoolUpdated

```solidity
event ConvexRewardPoolUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### ConvexZapUpdated

```solidity
event ConvexZapUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

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

### LpGetterUpdated

```solidity
event LpGetterUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### RewardTokenUpdated

```solidity
event RewardTokenUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### SavedFunds

```solidity
event SavedFunds(address indexed token, uint256 amount)
```

emitted when funds are saved in case of an emergency



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StrategyManagerUpdated

```solidity
event StrategyManagerUpdated(address indexed old, address indexed newAddress)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| old `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### UnderlyingAdded

```solidity
event UnderlyingAdded(address indexed newAddress)
```

emitted when a new underlying is added to the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| newAddress `indexed` | address | undefined |

### UnderlyingRemoved

```solidity
event UnderlyingRemoved(address indexed old)
```

emitted when a new underlying is removed from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| old `indexed` | address | undefined |



