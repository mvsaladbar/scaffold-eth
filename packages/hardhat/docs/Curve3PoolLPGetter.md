# Curve3PoolLPGetter

*Cosmin Grigore (@gcosmintech)*

> Curve 3Crv getter contract





## Methods

### DAI

```solidity
function DAI() external view returns (address)
```

returns dai address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### USDC

```solidity
function USDC() external view returns (address)
```

returns usdc address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### USDT

```solidity
function USDT() external view returns (address)
```

returns usdt address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### addLiquidityDai

```solidity
function addLiquidityDai(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add DAI liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation
| _minAmount | uint256 | the min amount of LP token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### addLiquidityUsdc

```solidity
function addLiquidityUsdc(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to add USDC liquidity



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of token to be used in the add liquidity operation
| _minAmount | uint256 | the min amount of LP token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

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

### curveLiquidityPool

```solidity
function curveLiquidityPool() external view returns (contract ICurve3LiquidityPool)
```

returns curve&#39;s liquidity pool




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurve3LiquidityPool | undefined

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### removeLiquidityDai

```solidity
function removeLiquidityDai(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get DAI



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation
| _minAmount | uint256 | the min amount of token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### removeLiquidityUsdc

```solidity
function removeLiquidityUsdc(uint256 _amount, uint256 _minAmount) external nonpayable returns (uint256)
```

used to remove liquidity and get USDC



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of LP token to be used in the remove liquidity operation
| _minAmount | uint256 | the min amount of token to be received

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

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

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### tokenOut

```solidity
function tokenOut() external view returns (address)
```

returns the lp token address




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

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

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



