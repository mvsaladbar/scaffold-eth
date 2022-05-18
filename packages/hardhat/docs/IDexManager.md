# IDexManager

*Cosmin Grigore (@gcosmintech)*

> Interface for the DEX manager





## Methods

### AMMs

```solidity
function AMMs(uint256 id) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### addLiquidity

```solidity
function addLiquidity(uint256 _ammId, address _lp, address _tokenA, address _tokenB, IDexManager.AddLiquidityParams amountParams, bytes _data) external nonpayable returns (uint256, uint256, uint256)
```

Adds liquidity and sends obtained LP &amp; leftovers to sender



#### Parameters

| Name | Type | Description |
|---|---|---|
| _ammId | uint256 | AMM id
| _lp | address | LP token address
| _tokenA | address | Token A address
| _tokenB | address | Token B address
| amountParams | IDexManager.AddLiquidityParams | Amount info (Desired amount for token A, Desired amount for token B, Min amount for token A, Min amount for token B)
| _data | bytes | AMM specific data

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | uint256 | undefined
| _2 | uint256 | undefined

### getAmountsOut

```solidity
function getAmountsOut(uint256 _ammId, address _tokenIn, address _tokenOut, uint256 _amountIn, bytes data) external view returns (uint256)
```

Returns the amount one would obtain from a swap



#### Parameters

| Name | Type | Description |
|---|---|---|
| _ammId | uint256 | AMM id
| _tokenIn | address | Token in address
| _tokenOut | address | Token to be ontained from swap address
| _amountIn | uint256 | Amount to be used for swap
| data | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | Token out amount

### getNextId

```solidity
function getNextId() external view returns (uint256)
```

View method to return the next id in line




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### isAMMPaused

```solidity
function isAMMPaused(uint256 id) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| id | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### removeLiquidity

```solidity
function removeLiquidity(uint256 _ammId, address _lp, address _tokenA, address _tokenB, IDexManager.RemoveLiquidityData amountParams, bytes _data) external nonpayable returns (uint256, uint256)
```

Removes liquidity and sends obtained tokens to sender



#### Parameters

| Name | Type | Description |
|---|---|---|
| _ammId | uint256 | AMM id
| _lp | address | LP token address
| _tokenA | address | Token A address
| _tokenB | address | Token B address
| amountParams | IDexManager.RemoveLiquidityData | Amount info (Min amount for token A, Min amount for token B, LP amount to be burnt)
| _data | bytes | AMM specific data

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | uint256 | undefined

### swap

```solidity
function swap(uint256 _ammId, address _tokenA, address _tokenB, uint256 _amountIn, uint256 _amountOutMin, bytes _data) external nonpayable returns (uint256)
```

Performs a swap



#### Parameters

| Name | Type | Description |
|---|---|---|
| _ammId | uint256 | AMM id
| _tokenA | address | Token A address
| _tokenB | address | Token B address
| _amountIn | uint256 | Token A amount
| _amountOutMin | uint256 | Min amount for Token B
| _data | bytes | AMM specific data

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined



## Events

### AMMPaused

```solidity
event AMMPaused(address indexed owner)
```

Event emitted when a registered AMM is paused



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |

### AMMRegistered

```solidity
event AMMRegistered(address indexed owner, address indexed ammWrapper, uint256 id)
```

Event emitted when a new AMM wrapper has been registered



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |
| ammWrapper `indexed` | address | undefined |
| id  | uint256 | undefined |

### AMMUnpaused

```solidity
event AMMUnpaused(address indexed owner)
```

Event emitted when a registered AMM is unpaused



#### Parameters

| Name | Type | Description |
|---|---|---|
| owner `indexed` | address | undefined |

### AddLiquidityPerformed

```solidity
event AddLiquidityPerformed(address indexed tokenA, address indexed tokenB, uint256 ammId, uint256 amountAIn, uint256 amountBIn, uint256 usedA, uint256 usedB, uint256 liquidityObtained)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenA `indexed` | address | undefined |
| tokenB `indexed` | address | undefined |
| ammId  | uint256 | undefined |
| amountAIn  | uint256 | undefined |
| amountBIn  | uint256 | undefined |
| usedA  | uint256 | undefined |
| usedB  | uint256 | undefined |
| liquidityObtained  | uint256 | undefined |

### RemovedLiquidityPerformed

```solidity
event RemovedLiquidityPerformed(address sender, uint256 lpAmount, uint256 obtainedA, uint256 obtainedB)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| sender  | address | undefined |
| lpAmount  | uint256 | undefined |
| obtainedA  | uint256 | undefined |
| obtainedB  | uint256 | undefined |

### SwapPerformed

```solidity
event SwapPerformed(address sender, address indexed tokenA, address indexed tokenB, uint256 ammId, uint256 amountIn, uint256 amountOutObtained)
```

Event emitted when a swap has been performed



#### Parameters

| Name | Type | Description |
|---|---|---|
| sender  | address | undefined |
| tokenA `indexed` | address | undefined |
| tokenB `indexed` | address | undefined |
| ammId  | uint256 | undefined |
| amountIn  | uint256 | undefined |
| amountOutObtained  | uint256 | undefined |



