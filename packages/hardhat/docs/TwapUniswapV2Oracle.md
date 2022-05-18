# TwapUniswapV2Oracle









## Methods

### baseToken

```solidity
function baseToken() external view returns (address)
```

address to base token of uniswapv2 pair




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### blockTimestampLast

```solidity
function blockTimestampLast() external view returns (uint32)
```



*blockTimestamp for latest updated*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint32 | undefined

### get

```solidity
function get(bytes) external nonpayable returns (bool success, uint256 price)
```



*update usd price of oracle asset*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| success | bool | undefined
| price | uint256 | undefined

### isFirstToken

```solidity
function isFirstToken() external view returns (bool)
```



*return true if baseToken is the firstToken of uniswapv2 pair*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

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

### pair

```solidity
function pair() external view returns (contract IUniswapV2Pair)
```

uniswapv2 pair




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IUniswapV2Pair | undefined

### peek

```solidity
function peek(bytes) external view returns (bool, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | usd price in 1e8 decimals
| _1 | uint256 | undefined

### peekSpot

```solidity
function peekSpot(bytes) external view returns (uint256 rate)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| rate | uint256 | undefined

### period

```solidity
function period() external view returns (uint256)
```

period for recomputing the average price




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### price0Average

```solidity
function price0Average() external view returns (uint256)
```



*return average price of firstToken in uniswapv2 pair*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### price0CumulativeLast

```solidity
function price0CumulativeLast() external view returns (uint256)
```



*uniswapv2pair accumulated price value (1 / 0)*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### price1Average

```solidity
function price1Average() external view returns (uint256)
```



*return average price of secondToken in uniswapv2 pair*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### price1CumulativeLast

```solidity
function price1CumulativeLast() external view returns (uint256)
```



*uniswapv2pair accumulated price value (0 / 1)*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### priceOracle

```solidity
function priceOracle() external view returns (contract IModChainlinkOracle)
```

price oracle




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IModChainlinkOracle | undefined

### principalToken

```solidity
function principalToken() external view returns (address)
```

address to principal token of uniswapv2 pair




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

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

### update

```solidity
function update() external nonpayable
```



*update the cumulative price for the observation at the current timestamp. each observation is updated at most once per epoch period.*




## Events

### PriceUpdated

```solidity
event PriceUpdated(address asset, uint256 newPrice)
```

Price update event



#### Parameters

| Name | Type | Description |
|---|---|---|
| asset  | address | the asset |
| newPrice  | uint256 | price of the asset |



