# IMerkleDistributor

*Cosmin Grigore (@gcosmintech)*

> Interface for a strategy





## Methods

### claim

```solidity
function claim(uint256 index, uint256 amount, bytes32[] merkleProof) external nonpayable
```

claims tokens for sender



#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | the index for which the claim is done
| amount | uint256 | the amount to claim
| merkleProof | bytes32[] | merkle tree proof

### isClaimed

```solidity
function isClaimed(uint256 index) external view returns (bool)
```

checks if index was claimed



#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### merkleRoot

```solidity
function merkleRoot() external view returns (bytes32)
```

returns the merkle root




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined

### token

```solidity
function token() external view returns (address)
```

returns claimable token address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined



## Events

### Claimed

```solidity
event Claimed(uint256 index, address account, uint256 amount)
```

event emitted when tokens are claimed



#### Parameters

| Name | Type | Description |
|---|---|---|
| index  | uint256 | undefined |
| account  | address | undefined |
| amount  | uint256 | undefined |



