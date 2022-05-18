# IHoldingManager









## Methods

### assignHolding

```solidity
function assignHolding(address _user) external nonpayable
```

assigns a new user to an existing holding

*callable by owner only*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | new user&#39;s address

### assignHoldingToMyself

```solidity
function assignHoldingToMyself() external nonpayable
```

user grabs an existing holding, with a deposit




### availableHoldings

```solidity
function availableHoldings(uint256) external view returns (address)
```

mapping of available holdings by position (position=&gt;holding address)



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### availableHoldingsHead

```solidity
function availableHoldingsHead() external view returns (uint256)
```

position of the first available holding




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### availableHoldingsTail

```solidity
function availableHoldingsTail() external view returns (uint256)
```

position of the last available holding




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### borrow

```solidity
function borrow(address _token, uint256 _amount, bool _mintDirectlyToUser) external nonpayable returns (uint256 part, uint256 share, uint256 fee)
```

mints stablecoin to the user or to the holding contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | collateral token
| _amount | uint256 | the borrowed amount
| _mintDirectlyToUser | bool | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| part | uint256 | undefined
| share | uint256 | undefined
| fee | uint256 | undefined

### borrowMultiple

```solidity
function borrowMultiple(IHoldingManager.BorrowOrRepayData[] _data, bool _mintDirectlyToUser) external nonpayable
```

borrows from multiple assets



#### Parameters

| Name | Type | Description |
|---|---|---|
| _data | IHoldingManager.BorrowOrRepayData[] | struct containing data for each collateral type
| _mintDirectlyToUser | bool | if true mints to user instead of holding

### createHolding

```solidity
function createHolding() external nonpayable returns (address)
```

creates holding and leaves it available to be assigned




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### createHoldingForMyself

```solidity
function createHoldingForMyself() external nonpayable returns (address)
```

creates holding at assigns it to the user




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### deposit

```solidity
function deposit(address _token, uint256 _amount) external nonpayable
```

deposits a whitelisted token into the holding



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token&#39;s address
| _amount | uint256 | amount to deposit

### exchange

```solidity
function exchange(uint256 _ammId, address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _minAmountOut, bytes _data) external nonpayable returns (uint256)
```

exchanges an existing token with a whitelisted one



#### Parameters

| Name | Type | Description |
|---|---|---|
| _ammId | uint256 | selected AMM id
| _tokenIn | address | token available in the contract
| _tokenOut | address | token resulting from the swap operation
| _amountIn | uint256 | exchange amount
| _minAmountOut | uint256 | min amount of tokenOut to receive when the swap is performed
| _data | bytes | specific amm data

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | the amount obtained

### holdingMinter

```solidity
function holdingMinter(address) external view returns (address)
```

mapping of minters of each holding (holding address =&gt; minter address)



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### holdingUser

```solidity
function holdingUser(address holding) external view returns (address)
```

returns user for holding



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### isHolding

```solidity
function isHolding(address _holding) external view returns (bool)
```

returns true if holding was created



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### liquidate

```solidity
function liquidate(address _liquidatedHolding, address _token, IHoldingManager.LiquidateData _data) external nonpayable returns (bool result, uint256 collateralAmount, uint256 protocolFeeAmount)
```

liquidate user

*if user is solvent liquidation won&#39;t work*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _liquidatedHolding | address | address of the holding which is being liquidated
| _token | address | collateral token
| _data | IHoldingManager.LiquidateData | liquidation data

#### Returns

| Name | Type | Description |
|---|---|---|
| result | bool | true if liquidation happened
| collateralAmount | uint256 | the amount of collateral to move
| protocolFeeAmount | uint256 | the protocol fee amount

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

interface of the manager container contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### numAvailableHoldings

```solidity
function numAvailableHoldings() external view returns (uint256)
```

number of available holding contracts (tail - head)




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### paused

```solidity
function paused() external view returns (bool)
```

returns the pause state of the contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### repay

```solidity
function repay(address _token, uint256 _amount, bool _repayFromUser) external nonpayable returns (uint256 amount)
```

registers a repay operation



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | collateral token
| _amount | uint256 | the repayed amount
| _repayFromUser | bool | if true it will burn from user&#39;s wallet, otherwise from user&#39;s holding

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined

### repayMultiple

```solidity
function repayMultiple(IHoldingManager.BorrowOrRepayData[] _data, bool _repayFromUser) external nonpayable
```

repays multiple assets



#### Parameters

| Name | Type | Description |
|---|---|---|
| _data | IHoldingManager.BorrowOrRepayData[] | struct containing data for each collateral type
| _repayFromUser | bool | if true it will burn from user&#39;s wallet, otherwise from user&#39;s holding

### selfLiquidate

```solidity
function selfLiquidate(address _token, uint256 _amount, IHoldingManager.SelfLiquidateData _data) external nonpayable returns (uint256)
```

method used to pay stablecoin debt by using own collateral



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token to be used as collateral
| _amount | uint256 | the amount of stablecoin to repay
| _data | IHoldingManager.SelfLiquidateData | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### setPaused

```solidity
function setPaused(bool _val) external nonpayable
```

sets a new value for pause state



#### Parameters

| Name | Type | Description |
|---|---|---|
| _val | bool | the new value

### userHolding

```solidity
function userHolding(address _user) external view returns (address)
```

returns holding for user



#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### withdraw

```solidity
function withdraw(address _token, uint256 _amount) external nonpayable
```

withdraws a token from the contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token user wants to withdraw
| _amount | uint256 | withdrawal amount



## Events

### Borrowed

```solidity
event Borrowed(address indexed holding, address indexed token, uint256 amount, uint256 fee, bool mintToUser)
```

event emitted when a borrow action was performed



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |
| fee  | uint256 | undefined |
| mintToUser  | bool | undefined |

### BorrowedMultiple

```solidity
event BorrowedMultiple(address indexed holding, uint256 length, bool mintedToUser)
```

event emitted when borrow event happened for multiple users



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| length  | uint256 | undefined |
| mintedToUser  | bool | undefined |

### CollateralFeeTaken

```solidity
event CollateralFeeTaken(address token, address holdingFrom, address to, uint256 amount)
```

event emitted when fee is moved from liquidated holding to fee addres



#### Parameters

| Name | Type | Description |
|---|---|---|
| token  | address | undefined |
| holdingFrom  | address | undefined |
| to  | address | undefined |
| amount  | uint256 | undefined |

### CollateralMoved

```solidity
event CollateralMoved(address indexed token, address indexed holdingFrom, address indexed holdingTo, uint256 amount)
```

event emitted when collateral is moved from liquidated holding to liquidating holding



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| holdingFrom `indexed` | address | undefined |
| holdingTo `indexed` | address | undefined |
| amount  | uint256 | undefined |

### CollateralRetrieved

```solidity
event CollateralRetrieved(address indexed token, address indexed holding, address indexed strategy, uint256 collateral)
```

event emitted when collateral is retrieved from a strategy in case of liquidation



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| holding `indexed` | address | undefined |
| strategy `indexed` | address | undefined |
| collateral  | uint256 | undefined |

### Deposit

```solidity
event Deposit(address indexed holding, address indexed token, uint256 amount)
```

emitted when a deposit is created



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### HoldingAssigned

```solidity
event HoldingAssigned(address indexed holding, address indexed minter, address indexed user)
```

emitted when a new user is assigned for the holding contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| minter `indexed` | address | undefined |
| user `indexed` | address | undefined |

### HoldingCreated

```solidity
event HoldingCreated(address indexed user, address indexed holdingAddress)
```

emitted when a new holding is crated



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| holdingAddress `indexed` | address | undefined |

### HoldingUninitialized

```solidity
event HoldingUninitialized(address indexed holding)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |

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

### ReceivedRewards

```solidity
event ReceivedRewards(address indexed holding, address indexed strategy, address indexed token, uint256 amount)
```

emitted when rewards are sent to the holding contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| strategy `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Repayed

```solidity
event Repayed(address indexed holding, address indexed token, uint256 amount, bool repayFromUser)
```

event emitted when a repay action was performed



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |
| repayFromUser  | bool | undefined |

### RepayedMultiple

```solidity
event RepayedMultiple(address indexed holding, uint256 length, bool repayedFromUser)
```

event emitted when a multiple repay operation happened



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| length  | uint256 | undefined |
| repayedFromUser  | bool | undefined |

### RewardsExchanged

```solidity
event RewardsExchanged(address indexed holding, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)
```

emitted when rewards were exchanged to another token



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| tokenIn `indexed` | address | undefined |
| tokenOut `indexed` | address | undefined |
| amountIn  | uint256 | undefined |
| amountOut  | uint256 | undefined |

### RewardsWithdrawn

```solidity
event RewardsWithdrawn(address indexed holding, address indexed token, uint256 amount)
```

emitted when rewards are withdrawn by the user



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### SelfLiquidated

```solidity
event SelfLiquidated(address indexed holding, address indexed token, uint256 amount, uint256 collateralUsed)
```

event emitted when self liquidation happened



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |
| collateralUsed  | uint256 | undefined |



