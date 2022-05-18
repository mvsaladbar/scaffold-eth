# ICurveTricryptoLPGetter

*Cosmin Grigore (@gcosmintech)*

> Interface for the tricrypto getter contract





## Methods

### USDT

```solidity
function USDT() external view returns (address)
```

returns usdt address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### WBTC

```solidity
function WBTC() external view returns (address)
```

returns usdc address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### WETH

```solidity
function WETH() external view returns (address)
```

returns dai address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### addLiquidityUsdt

```solidity
function addLiquidityUsdt(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add USDT liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation
| _minAmount | uint256 | the min amount of LP token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### addLiquidityWbtc

```solidity
function addLiquidityWbtc(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add WBTC liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation
| _minAmount | uint256 | the min amount of LP token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### addLiquidityWeth

```solidity
function addLiquidityWeth(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add WETH liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation
| _minAmount | uint256 | the min amount of LP token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### curveLiquidityPool

```solidity
function curveLiquidityPool() external nonpayable returns (contract ICurveTricryptoLiquidityPool)
```

returns curve&#39;s liquidity pool




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurveTricryptoLiquidityPool | undefined

### removeLiquidityUsdt

```solidity
function removeLiquidityUsdt(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get USDT



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation
| _minAmount | uint256 | the min amount of token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### removeLiquidityWbtc

```solidity
function removeLiquidityWbtc(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get WBTC



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation
| _minAmount | uint256 | the min amount of token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### removeLiquidityWeth

```solidity
function removeLiquidityWeth(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get WETH



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation
| _minAmount | uint256 | the min amount of token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### tokenOut

```solidity
function tokenOut() external view returns (address)
```

returns lp token address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined



## Events

### AddedLiquidity

```solidity
event AddedLiquidity(address indexed token, uint256 amount, uint256 obtainedLP)
```

event emitted when liquidity was added



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |
| obtainedLP  | uint256 | undefined |

### RemovedLiquidity

```solidity
event RemovedLiquidity(address indexed token, uint256 amountLP, uint256 obtainedAssets)
```

event emitted when liquidity was added



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amountLP  | uint256 | undefined |
| obtainedAssets  | uint256 | undefined |



