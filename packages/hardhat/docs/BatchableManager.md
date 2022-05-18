# BatchableManager









## Methods

### batch

```solidity
function batch(bytes[] calls, bool revertOnFail) external payable returns (bool[] successes, bytes[] results)
```

Allows batched call to self (this contract).



#### Parameters

| Name | Type | Description |
|---|---|---|
| calls | bytes[] | An array of inputs for each call.
| revertOnFail | bool | If True then reverts after a failed call and stops doing further calls.

#### Returns

| Name | Type | Description |
|---|---|---|
| successes | bool[] | An array indicating the success of a call, mapped one-to-one to `calls`.
| results | bytes[] | An array with the returned data of each function call, mapped one-to-one to `calls`.

### permitToken

```solidity
function permitToken(contract IERC20Permit token, address from, address to, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external nonpayable
```

Call wrapper that performs `ERC20.permit` on `token`.



#### Parameters

| Name | Type | Description |
|---|---|---|
| token | contract IERC20Permit | undefined
| from | address | undefined
| to | address | undefined
| amount | uint256 | undefined
| deadline | uint256 | undefined
| v | uint8 | undefined
| r | bytes32 | undefined
| s | bytes32 | undefined




