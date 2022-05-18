# ICurveDaiUsdcUsdtPoolGauge

*Cosmin Grigore (@gcosmintech)*

> Interface for Curve cDai+cUsdc+cUsdt staking gauge





## Methods

### balanceOf

```solidity
function balanceOf(address _addr) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### claimable_tokens

```solidity
function claimable_tokens(address _addr) external nonpayable returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addr | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### crv_token

```solidity
function crv_token() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### deposit

```solidity
function deposit(uint256 _value, address _addr) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _value | uint256 | undefined
| _addr | address | undefined

### withdraw

```solidity
function withdraw(uint256 value) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| value | uint256 | undefined




