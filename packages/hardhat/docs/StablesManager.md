# StablesManager

*Cosmin Grigore (@gcosmintech)*

> StablesManager contract





## Methods

### accrue

```solidity
function accrue(address _token) external nonpayable
```

accures interest for token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token&#39;s address

### addCollateral

```solidity
function addCollateral(address _holding, address _token, uint256 _amount) external nonpayable
```

registers new collateral

*the amount will be transformed to shares*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which collateral is added
| _token | address | collateral token
| _amount | uint256 | amount of tokens to be added as collateral

### borrow

```solidity
function borrow(address _holding, address _token, uint256 _amount, bool _mintDirectlyToUser) external nonpayable returns (uint256 part, uint256 share, uint256 feeAmount)
```

mints stablecoin to the user



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which collateral is added
| _token | address | collateral token
| _amount | uint256 | the borrowed amount
| _mintDirectlyToUser | bool | if true mints to user instead of holding

#### Returns

| Name | Type | Description |
|---|---|---|
| part | uint256 | undefined
| share | uint256 | undefined
| feeAmount | uint256 | undefined

### computeNeededCollateral

```solidity
function computeNeededCollateral(address _token, uint256 _amount) external view returns (uint256 result)
```

returns collateral amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | collateral token
| _amount | uint256 | stablecoin amount

#### Returns

| Name | Type | Description |
|---|---|---|
| result | uint256 | undefined

### forceAddCollateral

```solidity
function forceAddCollateral(address _holding, address _token, uint256 _amount) external nonpayable
```

accrues collateral for holding

*callable by the owner*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which collateral is added
| _token | address | collateral token
| _amount | uint256 | amount of collateral

### forceRemoveCollateral

```solidity
function forceRemoveCollateral(address _holding, address _token, uint256 _amount) external nonpayable
```

removes collateral for holding

*callable by the owner*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which collateral is removed
| _token | address | collateral token
| _amount | uint256 | amount of collateral

### getLiquidationInfo

```solidity
function getLiquidationInfo(address _holding, address _token) external view returns (uint256, uint256, uint256, uint256, bool)
```

get liquidation info for holding and token

*returns borrowed amount, collateral amount, collateral&#39;s value ratio, current borrow ratio, solvency status; colRatio needs to be &gt;= borrowRaio*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | address of the holding to check for
| _token | address | address of the token to check for

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined
| _1 | uint256 | undefined
| _2 | uint256 | undefined
| _3 | uint256 | undefined
| _4 | bool | undefined

### isSolvent

```solidity
function isSolvent(address _token, address _holding) external view returns (bool)
```

Returns true if user is solvent for the specified token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | the token for which the check is done
| _holding | address | the user address

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | true/false

### liquidate

```solidity
function liquidate(address _liquidatedHolding, address _token, address _holdingTo, bool _burnFromUser) external nonpayable returns (bool, uint256, uint256)
```

registers a liquidation event

*if user is solvent, there&#39;s no need for liqudation;*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _liquidatedHolding | address | address of the holding which is being liquidated
| _token | address | collateral token
| _holdingTo | address | address of the holding which initiated the liquidation
| _burnFromUser | bool | if true, burns stablecoin from the liquidating user, not from the holding

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | result true if liquidation happened
| _1 | uint256 | collateralAmount the amount of collateral to move
| _2 | uint256 | protocolFeeAmount the protocol fee amount

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

contract that contains the address of the manager contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### migrateDataToRegistry

```solidity
function migrateDataToRegistry(address _holding, address _tokenFrom, address _tokenTo, uint256 _collateralFrom, uint256 _collateralTo) external nonpayable
```

migrates collateral and share to a new registry



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which collateral is added
| _tokenFrom | address | collateral token source
| _tokenTo | address | collateral token destination
| _collateralFrom | uint256 | collateral amount to be removed from source
| _collateralTo | uint256 | collateral amount to be added to destination

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### pandoraUSD

```solidity
function pandoraUSD() external view returns (contract IPandoraUSD)
```

AlcBox project stablecoin address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IPandoraUSD | undefined

### paused

```solidity
function paused() external view returns (bool)
```

returns the pause state of the contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### registerShareRegistry

```solidity
function registerShareRegistry(address _registry, address _token) external nonpayable
```

registers a share registry contract for a token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _registry | address | registry contract address
| _token | address | token address

### removeCollateral

```solidity
function removeCollateral(address _holding, address _token, uint256 _amount) external nonpayable
```

unregisters collateral



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which collateral is added
| _token | address | collateral token
| _amount | uint256 | amount of collateral

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### repay

```solidity
function repay(address _holding, address _token, uint256 _part, bool _repayFromUser, bool _selfLiquidation) external nonpayable returns (uint256 amount)
```

registers a repay operation



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the holding for which repay is performed
| _token | address | collateral token
| _part | uint256 | the repayed amount
| _repayFromUser | bool | if true it will burn from user&#39;s wallet, otherwise from user&#39;s holding
| _selfLiquidation | bool | if true, nothing is burned

#### Returns

| Name | Type | Description |
|---|---|---|
| amount | uint256 | undefined

### setPandoraUSD

```solidity
function setPandoraUSD(address _newAddr) external nonpayable
```

sets the pUSD address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newAddr | address | contract&#39;s address

### setPaused

```solidity
function setPaused(bool _val) external nonpayable
```

sets a new value for pause state



#### Parameters

| Name | Type | Description |
|---|---|---|
| _val | bool | the new value

### shareRegistryInfo

```solidity
function shareRegistryInfo(address) external view returns (bool active, address deployedAt)
```

returns config info for each share



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| active | bool | undefined
| deployedAt | address | undefined

### toAmount

```solidity
function toAmount(contract IERC20 _token, uint256 _share, bool _roundUp) external view returns (uint256 _amount)
```



*Returns share to amount transformation*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | contract IERC20 | token for which the exchange is done
| _share | uint256 | amount of shares
| _roundUp | bool | if the resulted amount is rounded up

#### Returns

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | obtained amount

### toShare

```solidity
function toShare(contract IERC20 _token, uint256 _amount, bool _roundUp) external view returns (uint256 _share)
```

Returns amount to share transformation



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | contract IERC20 | token for which the exchange is done
| _amount | uint256 | token&#39;s amount
| _roundUp | bool | if the resulted shares are rounded up

#### Returns

| Name | Type | Description |
|---|---|---|
| _share | uint256 | obtained shares

### totalBorrowed

```solidity
function totalBorrowed(address) external view returns (uint128 elastic, uint128 base)
```

total borrow per token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| elastic | uint128 | undefined
| base | uint128 | undefined

### totals

```solidity
function totals(contract IERC20) external view returns (uint128 elastic, uint128 base)
```

returns totals, base and elastic



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| elastic | uint128 | undefined
| base | uint128 | undefined

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined

### updateShareRegistry

```solidity
function updateShareRegistry(address _registry, address _token, bool _active) external nonpayable
```

updates an already registered share registry contract for a token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _registry | address | registry contract address
| _token | address | token address
| _active | bool | set it as active or inactive



## Events

### AddedCollateral

```solidity
event AddedCollateral(address indexed user, address indexed token, uint256 amount)
```

event emitted when collateral was registered



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Borrowed

```solidity
event Borrowed(address indexed user, uint256 amount, uint256 part, bool mintToUser)
```

event emitted when a borrow action was performed



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| amount  | uint256 | undefined |
| part  | uint256 | undefined |
| mintToUser  | bool | undefined |

### CollateralMigrated

```solidity
event CollateralMigrated(address indexed holding, address indexed tokenFrom, address indexed tokenTo, uint256 borrowedAmount, uint256 borrowedShares, uint256 collateralTo)
```

event emitted when data is migrated to another collateral token



#### Parameters

| Name | Type | Description |
|---|---|---|
| holding `indexed` | address | undefined |
| tokenFrom `indexed` | address | undefined |
| tokenTo `indexed` | address | undefined |
| borrowedAmount  | uint256 | undefined |
| borrowedShares  | uint256 | undefined |
| collateralTo  | uint256 | undefined |

### ForceAddedCollateral

```solidity
event ForceAddedCollateral(address indexed user, address indexed token, uint256 amount)
```

event emitted when collateral was registered by the owner



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### ForceRemovedCollateral

```solidity
event ForceRemovedCollateral(address indexed user, address indexed token, uint256 amount)
```

event emitted when collateral was unregistered by the owner



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Liquidated

```solidity
event Liquidated(address indexed liquidatedUser, address indexed liquidatingUser, address indexed token, uint256 obtainedCollateral, uint256 protocolCollateral, uint256 liquidatedAmount)
```

event emmitted when a liquidation operation happened



#### Parameters

| Name | Type | Description |
|---|---|---|
| liquidatedUser `indexed` | address | undefined |
| liquidatingUser `indexed` | address | undefined |
| token `indexed` | address | undefined |
| obtainedCollateral  | uint256 | undefined |
| protocolCollateral  | uint256 | undefined |
| liquidatedAmount  | uint256 | undefined |

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

### RegistryAdded

```solidity
event RegistryAdded(address indexed token, address indexed registry)
```

event emitted when a registry is added



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| registry `indexed` | address | undefined |

### RegistryConfigUpdated

```solidity
event RegistryConfigUpdated(address indexed registry, bool active)
```

emitted when an existing strategy info is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| registry `indexed` | address | undefined |
| active  | bool | undefined |

### RegistryUpdated

```solidity
event RegistryUpdated(address indexed token, address indexed registry)
```

event emitted when a registry is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| registry `indexed` | address | undefined |

### RemovedCollateral

```solidity
event RemovedCollateral(address indexed user, address indexed token, uint256 amount)
```

event emitted when collateral was unregistered



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| token `indexed` | address | undefined |
| amount  | uint256 | undefined |

### Repayed

```solidity
event Repayed(address indexed user, uint256 amount, uint256 part, bool repayFromUser, bool selfLiquidation)
```

event emitted when a repay action was performed



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| amount  | uint256 | undefined |
| part  | uint256 | undefined |
| repayFromUser  | bool | undefined |
| selfLiquidation  | bool | undefined |

### StableAddressUpdated

```solidity
event StableAddressUpdated(address indexed _old, address indexed _new)
```

emitted when the PandoraUSD address is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| _old `indexed` | address | undefined |
| _new `indexed` | address | undefined |



