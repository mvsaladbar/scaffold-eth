# IConvexBaseRewardPool

*Cosmin Grigore (@gcosmintech)*

> Interface for the Convex booster





## Methods

### balanceOf

```solidity
function balanceOf(address _user) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### earned

```solidity
function earned(address _user) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getReward

```solidity
function getReward(address _account, bool _claimExtras) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined
| _claimExtras | bool | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### rewardPerToken

```solidity
function rewardPerToken() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### rewardToken

```solidity
function rewardToken() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### rewards

```solidity
function rewards(address _user) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### withdrawAndUnwrap

```solidity
function withdrawAndUnwrap(uint256 _amount, bool claim) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | undefined
| claim | bool | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined




