# ModChainlinkOracle









## Methods

### _get

```solidity
function _get(address aggregator) external view returns (uint256 rate)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| aggregator | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| rate | uint256 | undefined

### addAggregator

```solidity
function addAggregator(address _token, address _aggregator) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | undefined
| _aggregator | address | undefined

### aggregators

```solidity
function aggregators(address) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### get

```solidity
function get(bytes data) external view returns (bool, uint256)
```

Get the latest exchange rate.

*MAKE SURE THIS HAS 10^18 decimals*

#### Parameters

| Name | Type | Description |
|---|---|---|
| data | bytes | Usually abi encoded, implementation specific data that contains information and arguments to &amp; about the oracle. For example: (string memory collateralSymbol, string memory assetSymbol, uint256 division) = abi.decode(data, (string, string, uint256));

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | if no valid (recent) rate is available, return false else true.
| _1 | uint256 | The rate of the requested asset / pair / pool.

### getDataParameter

```solidity
function getDataParameter(address token) external view returns (bytes)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

### name

```solidity
function name(bytes) external pure returns (string)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### peek

```solidity
function peek(bytes data) external view returns (bool, uint256)
```

Check the last exchange rate without any state changes.



#### Parameters

| Name | Type | Description |
|---|---|---|
| data | bytes | Usually abi encoded, implementation specific data that contains information and arguments to &amp; about the oracle. For example: (string memory collateralSymbol, string memory assetSymbol, uint256 division) = abi.decode(data, (string, string, uint256));

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | if no valid (recent) rate is available, return false else true.
| _1 | uint256 | The rate of the requested asset / pair / pool.

### peekSpot

```solidity
function peekSpot(bytes data) external view returns (uint256)
```

Check the current spot exchange rate without any state changes. For oracles like TWAP this will be different from peek().



#### Parameters

| Name | Type | Description |
|---|---|---|
| data | bytes | Usually abi encoded, implementation specific data that contains information and arguments to &amp; about the oracle. For example: (string memory collateralSymbol, string memory assetSymbol, uint256 division) = abi.decode(data, (string, string, uint256));

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The rate of the requested asset / pair / pool.

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### symbol

```solidity
function symbol(bytes) external pure returns (string)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined

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

### AggregatorAdded

```solidity
event AggregatorAdded(address token, address aggregator)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token  | address | undefined |
| aggregator  | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



