# ICurveTricryptoLiquidityPool

*Cosmin Grigore (@gcosmintech)*

> Interface for the Curve Tricrypto Liquidity Pool





## Methods

### add_liquidity

```solidity
function add_liquidity(uint256[3] amounts, uint256 min_mint_amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| amounts | uint256[3] | undefined
| min_mint_amount | uint256 | undefined

### calc_withdraw_one_coin

```solidity
function calc_withdraw_one_coin(uint256 token_amount, uint256 i) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token_amount | uint256 | undefined
| i | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### coins

```solidity
function coins(uint256 i) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| i | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### remove_liquidity

```solidity
function remove_liquidity(uint256 _amount, uint256[3] min_amounts) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | undefined
| min_amounts | uint256[3] | undefined

### remove_liquidity_one_coin

```solidity
function remove_liquidity_one_coin(uint256 _token_amount, uint256 i, uint256 min_amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token_amount | uint256 | undefined
| i | uint256 | undefined
| min_amount | uint256 | undefined

### token

```solidity
function token() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined




