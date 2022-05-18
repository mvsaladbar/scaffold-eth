# ICurveDaiUsdcUsdtLiquidityPool

*Cosmin Grigore (@gcosmintech)*

> Interface for the Curve cDai+cUsdc+cUsdt Liquidity Pool





## Methods

### add_liquidity

```solidity
function add_liquidity(uint256[3] uamounts, uint256 min_mint_amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| uamounts | uint256[3] | undefined
| min_mint_amount | uint256 | undefined

### calc_withdraw_one_coin

```solidity
function calc_withdraw_one_coin(uint256 _token_amount, int128 i, uint256[3] rates) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token_amount | uint256 | undefined
| i | int128 | undefined
| rates | uint256[3] | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### coins

```solidity
function coins(int128 i) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| i | int128 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### curve

```solidity
function curve() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### remove_liquidity

```solidity
function remove_liquidity(uint256 _amount, uint256 min_uamounts) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | undefined
| min_uamounts | uint256 | undefined

### remove_liquidity_one_coin

```solidity
function remove_liquidity_one_coin(uint256 _token_amount, int128 i, uint256 min_uamount, bool donate_dust) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _token_amount | uint256 | undefined
| i | int128 | undefined
| min_uamount | uint256 | undefined
| donate_dust | bool | undefined

### token

```solidity
function token() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### underlying_coins

```solidity
function underlying_coins(int128 i) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| i | int128 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined




