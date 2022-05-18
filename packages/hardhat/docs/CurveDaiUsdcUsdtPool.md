# CurveDaiUsdcUsdtPool

*Cosmin Grigore (@gcosmintech)*

> CurveDaiUsdcUsdtPool strategy





## Methods

### addUnderlying

```solidity
function addUnderlying(address _asset) external nonpayable
```

adds an underlying token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _asset | address | the new address

### claimRewards

```solidity
function claimRewards(address _recipient, bytes) external nonpayable returns (uint256[], address[])
```

claims rewards from the strategy



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | on behalf of
| _1 | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined
| _1 | address[] | undefined

### curveLPGetter

```solidity
function curveLPGetter() external view returns (contract ICurveDaiUsdcUsdtLPGetter)
```

custom contract for obtaining tokenIn




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurveDaiUsdcUsdtLPGetter | undefined

### curveMinter

```solidity
function curveMinter() external view returns (contract ICurveMinter)
```

rewards curve minter




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurveMinter | undefined

### deposit

```solidity
function deposit(address _asset, uint256 _amount, address _recipient, bytes _data) external nonpayable returns (uint256, uint256)
```

deposits funds into the strategy

*some strategies won&#39;t give back any receipt tokens; in this case &#39;tokenOutAmount&#39; will be 0&#39;tokenInAmount&#39; will be equal to &#39;_amount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _asset | address | token to be invested
| _amount | uint256 | token&#39;s amount
| _recipient | address | on behalf of returns receipt tokens amount/obtained shares returns tokenin() amount
| _data | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | uint256 | undefined

### emergencySave

```solidity
function emergencySave(address _token, uint256 _amount) external nonpayable
```

save funds



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token address
| _amount | uint256 | token amount

### getRewards

```solidity
function getRewards(address _recipient) external pure returns (uint256)
```

returns rewards for recipient



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | holder&#39;s address

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | amount

### getRewardsNonView

```solidity
function getRewardsNonView(address _recipient) external nonpayable returns (uint256)
```

returns rewards for recipient



#### Parameters

| Name | Type | Description |
|---|---|---|
| _recipient | address | holder&#39;s address

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | amount

### holdingHasTokenOutBalance

```solidity
function holdingHasTokenOutBalance() external view returns (bool)
```

returns true if tokenOut is transferred to holding




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### lpGauge

```solidity
function lpGauge() external view returns (contract ICurveDaiUsdcUsdtPoolGauge)
```

curve lp gauge




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurveDaiUsdcUsdtPoolGauge | undefined

### lpVault

```solidity
function lpVault() external view returns (contract ICurveDaiUsdcUsdtLiquidityPool)
```

curve lp vault




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract ICurveDaiUsdcUsdtLiquidityPool | undefined

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

contract that contains the address of the manager contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### recipients

```solidity
function recipients(address) external view returns (uint256 investedAmount, uint256 totalShares)
```

participants details



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| investedAmount | uint256 | undefined
| totalShares | uint256 | undefined

### removeUnderlying

```solidity
function removeUnderlying(address _asset) external nonpayable
```

removes an underlying token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _asset | address | the new address

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### rewardToken

```solidity
function rewardToken() external view returns (address)
```

reward tokens offered to users




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### setGauge

```solidity
function setGauge(address _newAddr) external nonpayable
```

sets the new address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newAddr | address | the new address

### setLPGetter

```solidity
function setLPGetter(address _newAddr) external nonpayable
```

sets the new address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newAddr | address | the new address

### setTricryptoMinter

```solidity
function setTricryptoMinter(address _newAddr) external nonpayable
```

sets the new address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newAddr | address | the new address

### setVault

```solidity
function setVault(address _newAddr) external nonpayable
```

sets the new address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newAddr | address | the new address

### tokenIn

```solidity
function tokenIn() external view returns (address)
```

the LP token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### tokenOut

```solidity
function tokenOut() external view returns (address)
```

the Convex receipt token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### totalInvestments

```solidity
function totalInvestments() external view returns (uint256)
```

total investments for the strategy




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined

### whitelistedUnderlyingTokenIn

```solidity
function whitelistedUnderlyingTokenIn(address) external view returns (bool)
```

underlying tokens for obtaining the tokenIn LP one



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### withdraw

```solidity
function withdraw(uint256 _shares, address _recipient, address _asset, bytes _data) external nonpayable returns (uint256, uint256)
```

withdraws deposited funds

*some strategies will allow only the tokenIn to be withdrawn&#39;assetAmount&#39; will be equal to &#39;tokenInAmount&#39; in case the &#39;_asset&#39; is the same as strategy &#39;tokenIn()&#39;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _shares | uint256 | amount to withdraw
| _recipient | address | on behalf of
| _asset | address | token to be withdrawn returns asset amoumt obtained from the operation returns token in amount
| _data | bytes | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | uint256 | undefined



## Events

### CurveLpGetterUpdated

```solidity
event CurveLpGetterUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

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

### GaugeUpdated

```solidity
event GaugeUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### MinterUpdated

```solidity
event MinterUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### RewardTokenUpdated

```solidity
event RewardTokenUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

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

### SavedFunds

```solidity
event SavedFunds(address indexed token, uint256 amount)
```

emitted when funds are saved in case of an emergency



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### StrategyManagerUpdated

```solidity
event StrategyManagerUpdated(address indexed old, address indexed newAddress)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| old `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### UnderlyingAdded

```solidity
event UnderlyingAdded(address indexed newAddress)
```

emitted when a new underlying is added to the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| newAddress `indexed` | address | undefined |

### UnderlyingRemoved

```solidity
event UnderlyingRemoved(address indexed old)
```

emitted when a new underlying is removed from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| old `indexed` | address | undefined |

### VaultUpdated

```solidity
event VaultUpdated(address indexed _old, address indexed _new)
```

emitted when the address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |

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



