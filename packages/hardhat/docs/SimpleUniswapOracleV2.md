# SimpleUniswapOracleV2









## Methods

### _get

```solidity
function _get(address pair) external view returns (uint256 rate)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| pair | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| rate | uint256 | undefined

### baseOracle

```solidity
function baseOracle() external view returns (contract IModChainlinkOracle)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IModChainlinkOracle | undefined

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
function getDataParameter(address pair) external pure returns (bytes)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| pair | address | undefined

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




