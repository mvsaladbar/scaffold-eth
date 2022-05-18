# SigningManager









## Methods

### approvals

```solidity
function approvals(address, address) external view returns (bool)
```

contract -&gt; user -&gt; approval state



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined
| _1 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### approveWithSignature

```solidity
function approveWithSignature(address _user, address _contract, bool _approved, uint8 v, bytes32 r, bytes32 s) external nonpayable
```

Approves or revokes a `_contract` access to `_user` funds.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | The address of the user that approves or revokes access.
| _contract | address | The address who gains or loses access.
| _approved | bool | If True approves access. If False revokes access.
| v | uint8 | recovery id
| r | bytes32 | output of an ECDSA signature
| s | bytes32 | output of an ECDSA signature

### cloneV1

```solidity
function cloneV1(address _signingManager, bytes _data) external payable returns (address result)
```

Clones a SigningManager contract using CREATE opcode and forwards the sent ETH to the new clone



#### Parameters

| Name | Type | Description |
|---|---|---|
| _signingManager | address | Address of the SigningManager contract
| _data | bytes | Additional abi encoded calldata that is passed to the new clone via `ISigningManager.init`.

#### Returns

| Name | Type | Description |
|---|---|---|
| result | address | Clone address

### cloneV2

```solidity
function cloneV2(address _signingManager, bytes _data) external payable returns (address result)
```

Clones a SigningManager contract using CREATE2 opcode and forwards the sent ETH to the new clone



#### Parameters

| Name | Type | Description |
|---|---|---|
| _signingManager | address | Address of the SigningManager contract
| _data | bytes | Additional abi encoded calldata that is passed to the new clone via `ISigningManager.init`.

#### Returns

| Name | Type | Description |
|---|---|---|
| result | address | Clone address

### getDomainSeparator

```solidity
function getDomainSeparator() external view returns (bytes32)
```

Returns the domain separate for the current chain id




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined

### nonces

```solidity
function nonces(address) external view returns (uint256)
```

user nonces for the approval operations



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### parents

```solidity
function parents(address) external view returns (address)
```

Mapping from clone contracts to their signingManager.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

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

### whitelistSigner

```solidity
function whitelistSigner(address _signingManager, bool _add) external nonpayable
```

Enables or disables a contract for approval without signed message



#### Parameters

| Name | Type | Description |
|---|---|---|
| _signingManager | address | SingingManager&#39;s address
| _add | bool | If true, the SigningManager is added to the whitelist; otherwise it&#39;s removed

### whitelisted

```solidity
function whitelisted(address) external view returns (bool)
```

list of whitelisted contracts for which users can allow or revoke access; only checked in case signature is not provided



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined



## Events

### Approved

```solidity
event Approved(address indexed signingManager, address indexed user, bool approved)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signingManager `indexed` | address | undefined |
| user `indexed` | address | undefined |
| approved  | bool | undefined |

### Cloned

```solidity
event Cloned(address indexed signingManager, bytes data, address indexed cloneAddress)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signingManager `indexed` | address | undefined |
| data  | bytes | undefined |
| cloneAddress `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### Registered

```solidity
event Registered(address indexed protocol)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| protocol `indexed` | address | undefined |

### Whitelisted

```solidity
event Whitelisted(address indexed signingManager, bool approved)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| signingManager `indexed` | address | undefined |
| approved  | bool | undefined |



