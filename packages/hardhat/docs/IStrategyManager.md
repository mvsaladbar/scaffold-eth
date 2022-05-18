# IStrategyManager

*Cosmin Grigore (@gcosmintech)*

> Interface for the Strategy Manager contract





## Methods

### addStrategy

```solidity
function addStrategy(address _strategy) external nonpayable
```

adds a new strategy to the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | strategy&#39;s address

### claimInvestment

```solidity
function claimInvestment(address _holding, address _strategy, uint256 _shares, address _asset, bytes _data) external nonpayable returns (uint256 assetAmount, uint256 tokenInAmount)
```

claims a strategy investment

*withdraws investment from a strategysome strategies will allow only the tokenIn to be withdrawn&#39;assetAmount&#39; will be equal to &#39;tokenInAmount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | holding&#39;s address
| _strategy | address | strategy to invest into
| _shares | uint256 | shares amount
| _asset | address | token address to be received
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| assetAmount | uint256 | returned asset amoumt obtained from the operation
| tokenInAmount | uint256 | returned token in amount

### claimRewards

```solidity
function claimRewards(address _strategy, bytes _data) external nonpayable returns (uint256[] amounts, address[] tokens)
```

claim rewards from strategy



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | strategy&#39;s address
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| amounts | uint256[] | reward amounts
| tokens | address[] | reward tokens

### invest

```solidity
function invest(address _token, address _strategy, uint256 _amount, bytes _data) external nonpayable returns (uint256 tokenOutAmount, uint256 tokenInAmount)
```

invests in a strategy

*some strategies won&#39;t give back any receipt tokens; in this case &#39;tokenOutAmount&#39; will be 0&#39;tokenInAmount&#39; will be equal to &#39;_amount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token&#39;s address
| _strategy | address | strategy&#39;s address
| _amount | uint256 | token&#39;s amount
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| tokenOutAmount | uint256 | returned receipt tokens amount
| tokenInAmount | uint256 | returned token in amount

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

interface of the manager container contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### moveInvestment

```solidity
function moveInvestment(address _token, IStrategyManager.MoveInvestmentData _data) external nonpayable returns (uint256 tokenOutAmount, uint256 tokenInAmount)
```

claims investment from one strategy and invests it into another

*callable by holding&#39;s usersome strategies won&#39;t give back any receipt tokens; in this case &#39;tokenOutAmount&#39; will be 0&#39;tokenInAmount&#39; will be equal to &#39;_amount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token&#39;s address
| _data | IStrategyManager.MoveInvestmentData | MoveInvestmentData object

#### Returns

| Name | Type | Description |
|---|---|---|
| tokenOutAmount | uint256 | returned receipt tokens amount
| tokenInAmount | uint256 | returned token in amount

### paused

```solidity
function paused() external view returns (bool)
```

returns the pause state of the contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### removeStrategy

```solidity
function removeStrategy(address _strategy) external nonpayable
```

removes a strategy from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | strategy&#39;s address

### setPaused

```solidity
function setPaused(bool _val) external nonpayable
```

sets a new value for pause state



#### Parameters

| Name | Type | Description |
|---|---|---|
| _val | bool | the new value

### strategyInfo

```solidity
function strategyInfo(address _strategy) external view returns (uint256, bool, bool)
```

returns whitelisted strategies



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | bool | undefined
| _2 | bool | undefined

### updateStrategy

```solidity
function updateStrategy(address _strategy, IStrategyManager.StrategyInfo _info) external nonpayable
```

updates an existing strategy info



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | strategy&#39;s address
| _info | IStrategyManager.StrategyInfo | info



## Events

### CollateralAdjusted

```solidity
event CollateralAdjusted(address indexed holding, address indexed token, uint256 value, bool add)
```

event emitted when collateral is adjusted from a claim investment or claim rewards operation



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| token `indexed` | address | undefined |
| value  | uint256 | undefined |
| add  | bool | undefined |

### FeeTaken

```solidity
event FeeTaken(address indexed token, address indexed feeAddress, uint256 amount)
```

event emitted when performance fee is taken



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| feeAddress `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Invested

```solidity
event Invested(address indexed holding, address indexed user, address indexed token, address strategy, uint256 amount, uint256 tokenOutResult, uint256 tokenInResult)
```

emitted when an investment is created



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| strategy  | address | undefined |
| amount  | uint256 | undefined |
| tokenOutResult  | uint256 | undefined |
| tokenInResult  | uint256 | undefined |

### InvestmentMoved

```solidity
event InvestmentMoved(address indexed holding, address indexed user, address indexed token, address strategyFrom, address strategyTo, uint256 shares, uint256 tokenOutResult, uint256 tokenInResult)
```

emitted when an investment is withdrawn



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| strategyFrom  | address | undefined |
| strategyTo  | address | undefined |
| shares  | uint256 | undefined |
| tokenOutResult  | uint256 | undefined |
| tokenInResult  | uint256 | undefined |

### PauseUpdated

```solidity
event PauseUpdated(bool oldVal, bool newVal)
```

event emitted when pause state is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldVal  | bool | undefined |
| newVal  | bool | undefined |

### RewardsClaimed

```solidity
event RewardsClaimed(address indexed token, address indexed holding, uint256 amount)
```

event emitted when rewards are claimed



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| holding `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StrategyAdded

```solidity
event StrategyAdded(address indexed strategy)
```

emitted when a new strategy is added to the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| strategy `indexed` | address | undefined |

### StrategyClaim

```solidity
event StrategyClaim(address indexed holding, address indexed user, address indexed token, address strategy, uint256 shares, uint256 tokenAmount, uint256 tokenInAmount)
```

emitted when an investment is withdrawn



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| strategy  | address | undefined |
| shares  | uint256 | undefined |
| tokenAmount  | uint256 | undefined |
| tokenInAmount  | uint256 | undefined |

### StrategyRemoved

```solidity
event StrategyRemoved(address indexed strategy)
```

emitted when an existing strategy is removed from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| strategy `indexed` | address | undefined |

### StrategyUpdated

```solidity
event StrategyUpdated(address indexed strategy, bool active, uint256 fee)
```

emitted when an existing strategy info is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| strategy `indexed` | address | undefined |
| active  | bool | undefined |
| fee  | uint256 | undefined |



