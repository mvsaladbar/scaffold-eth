# StrategyBase

*Cosmin Grigore (@gcosmintech)*

> StrategyBase contract used for any Aave strategy





## Methods

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

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined



## Events

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

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



