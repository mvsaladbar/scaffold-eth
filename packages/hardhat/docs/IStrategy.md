# IStrategy

*Cosmin Grigore (@gcosmintech)*

> Interface for a strategy





## Methods

### claimRewards

```solidity
function claimRewards(address _recipient, bytes _data) external nonpayable returns (uint256[] amounts, address[] tokens)
```

claims rewards from the strategy



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | on behalf of
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| amounts | uint256[] | reward tokens amounts
| tokens | address[] | reward tokens addresses

### deposit

```solidity
function deposit(address _asset, uint256 _amount, address _recipient, bytes _data) external nonpayable returns (uint256 tokenOutAmount, uint256 tokenInAmount)
```

deposits funds into the strategy

*some strategies won&#39;t give back any receipt tokens; in this case &#39;tokenOutAmount&#39; will be 0&#39;tokenInAmount&#39; will be equal to &#39;_amount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _asset | address | token to be invested
| _amount | uint256 | token&#39;s amount
| _recipient | address | on behalf of
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| tokenOutAmount | uint256 | receipt tokens amount/obtained shares
| tokenInAmount | uint256 | returned token in amount

### getRewards

```solidity
function getRewards(address _recipient) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### holdingHasTokenOutBalance

```solidity
function holdingHasTokenOutBalance() external view returns (bool)
```

returns true if tokenOut exists in holding




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### recipients

```solidity
function recipients(address _recipient) external view returns (uint256, uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | uint256 | undefined

### rewardToken

```solidity
function rewardToken() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### tokenIn

```solidity
function tokenIn() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### tokenOut

```solidity
function tokenOut() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### withdraw

```solidity
function withdraw(uint256 _shares, address _recipient, address _asset, bytes _data) external nonpayable returns (uint256 assetAmount, uint256 tokenInAmount)
```

withdraws deposited funds

*some strategies will allow only the tokenIn to be withdrawn&#39;assetAmount&#39; will be equal to &#39;tokenInAmount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _shares | uint256 | amount to withdraw
| _recipient | address | on behalf of
| _asset | address | token to be withdrawn
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| assetAmount | uint256 | returned asset amoumt obtained from the operation
| tokenInAmount | uint256 | returned token in amount



## Events

### Deposit

```solidity
event Deposit(address indexed asset, address indexed tokenIn, uint256 assetAmount, uint256 tokenInAmount, uint256 shares, address indexed recipient)
```

emitted when funds are deposited



#### Parameters

| Name | Type | Description |
|---|---|---|
| asset `indexed` | address | undefined |
| tokenIn `indexed` | address | undefined |
| assetAmount  | uint256 | undefined |
| tokenInAmount  | uint256 | undefined |
| shares  | uint256 | undefined |
| recipient `indexed` | address | undefined |

### Rewards

```solidity
event Rewards(address indexed recipient, uint256[] rewards, address[] rewardTokens)
```

emitted when rewards are withdrawn



#### Parameters

| Name | Type | Description |
|---|---|---|
| recipient `indexed` | address | undefined |
| rewards  | uint256[] | undefined |
| rewardTokens  | address[] | undefined |

### Withdraw

```solidity
event Withdraw(address indexed asset, address indexed recipient, uint256 shares, uint256 amount)
```

emitted when funds are withdrawn



#### Parameters

| Name | Type | Description |
|---|---|---|
| asset `indexed` | address | undefined |
| recipient `indexed` | address | undefined |
| shares  | uint256 | undefined |
| amount  | uint256 | undefined |



