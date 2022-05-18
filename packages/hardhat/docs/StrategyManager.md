# StrategyManager

*Cosmin Grigore (@gcosmintech)*

> StrategyManager contract





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
| assetAmount | uint256 | returned asset amount obtained from the operation
| tokenInAmount | uint256 | returned token in amount

### claimRewards

```solidity
function claimRewards(address _strategy, bytes _data) external nonpayable returns (uint256[] rewards, address[] tokens)
```

claims rewards from strategy



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | strategy to invest into
| _data | bytes | extra data

#### Returns

| Name | Type | Description |
|---|---|---|
| rewards | uint256[] | reward amounts
| tokens | address[] | reward tokens

### invest

```solidity
function invest(address _token, address _strategy, uint256 _amount, bytes _data) external nonpayable returns (uint256 tokenOutAmount, uint256 tokenInAmount)
```

invests token into one of the whitelisted strategies

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

contract that contains the address of the manager contract




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

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

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

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


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
function strategyInfo(address) external view returns (uint256 performanceFee, bool active, bool whitelisted)
```

returns whitelisted strategies info



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| performanceFee | uint256 | undefined
| active | bool | undefined
| whitelisted | bool | undefined

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined

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

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

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



