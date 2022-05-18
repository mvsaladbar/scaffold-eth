# ICompoundToken

*Cosmin Grigore (@gcosmintech)*

> Interface for the CToken





## Methods

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### decimals

```solidity
function decimals() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### exchangeRateCurrent

```solidity
function exchangeRateCurrent() external nonpayable returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### exchangeRateStored

```solidity
function exchangeRateStored() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### mint

```solidity
function mint(uint256 mintAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| mintAmount | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### redeem

```solidity
function redeem(uint256 redeemTokens) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemTokens | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### redeemUnderlying

```solidity
function redeemUnderlying(uint256 redeemAmount) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| redeemAmount | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### underlying

```solidity
function underlying() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined




