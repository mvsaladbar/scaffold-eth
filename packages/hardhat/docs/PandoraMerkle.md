# PandoraMerkle

*Cosmin Grigore (@gcosmintech)*

> PandoraMerkle contract





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


### token

```solidity
function token() external view returns (address)
```

returns PandoraToken address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

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

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



