# ManagerContainer









## Methods

### manager

```solidity
function manager() external view returns (address)
```

returns manager address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

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

### updateManager

```solidity
function updateManager(address _newManager) external nonpayable
```

Updates the manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newManager | address | The address of the manager



## Events

### ManagerUpdated

```solidity
event ManagerUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the strategy manager is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



