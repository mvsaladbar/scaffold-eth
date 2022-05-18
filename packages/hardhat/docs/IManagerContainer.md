# IManagerContainer









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

### updateManager

```solidity
function updateManager(address _address) external nonpayable
```

Updates the manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _address | address | The address of the manager



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



