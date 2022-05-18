# Holding









## Methods

### approve

```solidity
function approve(address _tokenAddress, address _destination, uint256 _amount) external nonpayable
```

approves an amount of a token to another address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenAddress | address | token user wants to withdraw
| _destination | address | destination address of the approval
| _amount | uint256 | withdrawal amount

### genericCall

```solidity
function genericCall(address _contract, bytes _call) external nonpayable returns (bool success, bytes result)
```

generic caller for contract

*callable only by HoldingManager, StrategyManager or the strategies to avoid risky situationsused mostly for claim rewards part of the strategies as only the registered staker can harvest*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _contract | address | the contract address for which the call will be invoked
| _call | bytes | abi.encodeWithSignature data for the call

#### Returns

| Name | Type | Description |
|---|---|---|
| success | bool | undefined
| result | bytes | undefined

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

returns the managerContainer address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### transfer

```solidity
function transfer(address _token, address _to, uint256 _amount) external nonpayable
```

transfers token to another address

*used when shares are claimed from strategies*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token address
| _to | address | address to move token to
| _amount | uint256 | transferal amount




