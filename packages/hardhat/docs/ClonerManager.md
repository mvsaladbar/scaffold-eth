# ClonerManager



> Creates clones using CREATE or CREATE2 opcodes





## Methods

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



## Events

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



