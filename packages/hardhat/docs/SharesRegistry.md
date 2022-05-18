# SharesRegistry

*Cosmin Grigore (@gcosmintech)*

> SharesRegistry contract





## Methods

### acceptOwnership

```solidity
function acceptOwnership() external nonpayable
```

finalizes the ownership transferal process

*must be called after `transferOwnership` was executed successfully, by the new temporary onwer*


### accrue

```solidity
function accrue(uint256 _totalBorrowBase, uint256 _totalBorrowElastic) external nonpayable returns (uint128)
```

Accrues the interest on the borrowed tokens and handles the accumulation of fees.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _totalBorrowBase | uint256 | total borrow amount
| _totalBorrowElastic | uint256 | total borrow shares

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint128 | undefined

### accrueFees

```solidity
function accrueFees(uint256 _amount) external nonpayable
```

accruees fees for the AccrueInfo object



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | of new fees to be registered

### accrueInfo

```solidity
function accrueInfo() external view returns (uint64 lastAccrued, uint128 feesEarned, uint64 INTEREST_PER_SECOND)
```

info about the accrued data




#### Returns

| Name | Type | Description |
|---|---|---|
| lastAccrued | uint64 | undefined
| feesEarned | uint128 | undefined
| INTEREST_PER_SECOND | uint64 | undefined

### borrowOpeningFee

```solidity
function borrowOpeningFee() external view returns (uint256)
```

borrowing fee amount




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### borrowed

```solidity
function borrowed(address) external view returns (uint256)
```

borrowed amount for holding; holding &gt; amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### borrowedShares

```solidity
function borrowedShares(address) external view returns (uint256)
```

borrowed shares for holding; holding  &gt; shares



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### collateral

```solidity
function collateral(address) external view returns (uint256)
```

total collateral for Holding, per token (Holding=&gt;collateral amount)



#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### collateralizationRate

```solidity
function collateralizationRate() external view returns (uint256)
```

collateralization rate for token




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### exchangeRate

```solidity
function exchangeRate() external view returns (uint256)
```

exchange and interest rate tracking this is &#39;cached&#39; here because calls to oracles can be very expensive




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### liquidationMultiplier

```solidity
function liquidationMultiplier() external view returns (uint256)
```

liquidation multiplier used when liquidated to accrue protocol&#39;s fee




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

contract that contains the address of the manager contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### oracle

```solidity
function oracle() external view returns (contract IOracle)
```

oracle contract associated with this share registry




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IOracle | undefined

### oracleData

```solidity
function oracleData() external view returns (bytes)
```

extra oracle data if needed




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes | undefined

### owner

```solidity
function owner() external view returns (address)
```

current owner




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### registerCollateral

```solidity
function registerCollateral(address _holding, uint256 _share) external nonpayable
```

registers collateral for user



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the address of the user
| _share | uint256 | the new collateral shares

### setBorrowed

```solidity
function setBorrowed(address _holding, uint256 _newVal) external nonpayable
```

sets a new value for borrowed



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the address of the user
| _newVal | uint256 | the new amount

### setBorrowedShares

```solidity
function setBorrowedShares(address _holding, uint256 _newVal) external nonpayable
```

sets a new value for borrowedShares



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the address of the user
| _newVal | uint256 | the new amount

### setBorrowingFee

```solidity
function setBorrowingFee(uint256 _newVal) external nonpayable
```

updates the borrowing opening fee



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newVal | uint256 | the new value

### setCollateralizationRate

```solidity
function setCollateralizationRate(uint256 _newVal) external nonpayable
```

updates the colalteralization rate



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newVal | uint256 | the new value

### setLiquidationMultiplier

```solidity
function setLiquidationMultiplier(uint256 _newVal) external nonpayable
```

updates the liquidation multiplier



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newVal | uint256 | the new value

### setOracleData

```solidity
function setOracleData(bytes _oracleData) external nonpayable
```

updates the oracle data



#### Parameters

| Name | Type | Description |
|---|---|---|
| _oracleData | bytes | the new data

### temporaryOwner

```solidity
function temporaryOwner() external view returns (address)
```

possible new owner

*if different than `owner` an ownership transfer is in  progress and has to be accepted by the new owner*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### token

```solidity
function token() external view returns (address)
```

the token this registry is for




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### transferOwnership

```solidity
function transferOwnership(address _newOwner) external nonpayable
```

initiates the ownership transferal



#### Parameters

| Name | Type | Description |
|---|---|---|
| _newOwner | address | the address of the new owner

### unregisterCollateral

```solidity
function unregisterCollateral(address _holding, uint256 _share, uint256 _totalBorrowBase, uint256 _totalBorrowElastic) external nonpayable
```

registers a collateral removal operation



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | the address of the user
| _share | uint256 | the new collateral shares
| _totalBorrowBase | uint256 | total borrow amount
| _totalBorrowElastic | uint256 | total borrow shares

### updateExchangeRate

```solidity
function updateExchangeRate() external nonpayable returns (bool updated, uint256 rate)
```

Gets the exchange rate. I.e how much collateral to buy 1e18 asset. This function is supposed to be invoked if needed because Oracle queries can be expensive.




#### Returns

| Name | Type | Description |
|---|---|---|
| updated | bool | True if `exchangeRate` was updated.
| rate | uint256 | The new exchange rate.

### updateLiquidatedCollateral

```solidity
function updateLiquidatedCollateral(address _from, address _to, uint256 _share) external nonpayable
```

removes collateral share from user



#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | the address for which the collateral is removed
| _to | address | the address for which the collateral is added
| _share | uint256 | share amount



## Events

### Accrued

```solidity
event Accrued(uint256 updatedTotalBorrow, uint256 extraAmount)
```

event emitted when accrue was called



#### Parameters

| Name | Type | Description |
|---|---|---|
| updatedTotalBorrow  | uint256 | undefined |
| extraAmount  | uint256 | undefined |

### BorrowedSet

```solidity
event BorrowedSet(address _holding, uint256 oldVal, uint256 newVal)
```

event emitted when borrowed amount is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding  | address | undefined |
| oldVal  | uint256 | undefined |
| newVal  | uint256 | undefined |

### BorrowedSharesSet

```solidity
event BorrowedSharesSet(address _holding, uint256 oldVal, uint256 newVal)
```

event emitted when borrowed shares amount is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding  | address | undefined |
| oldVal  | uint256 | undefined |
| newVal  | uint256 | undefined |

### BorrowingOpeningFeeUpdated

```solidity
event BorrowingOpeningFeeUpdated(uint256 oldVal, uint256 newVal)
```

event emitted when the borrowing opening fee is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldVal  | uint256 | undefined |
| newVal  | uint256 | undefined |

### CollateralAdded

```solidity
event CollateralAdded(address indexed user, uint256 share)
```

event emitted when collateral was registered



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| share  | uint256 | undefined |

### CollateralRemoved

```solidity
event CollateralRemoved(address indexed user, uint256 share)
```

event emitted when collateral was unregistered



#### Parameters

| Name | Type | Description |
|---|---|---|
| user `indexed` | address | undefined |
| share  | uint256 | undefined |

### CollateralizationRateUpdated

```solidity
event CollateralizationRateUpdated(uint256 oldVal, uint256 newVal)
```

event emitted when the collateralization rate is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldVal  | uint256 | undefined |
| newVal  | uint256 | undefined |

### ExchangeRateUpdated

```solidity
event ExchangeRateUpdated(uint256 rate)
```

event emitted when exchange rate was updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| rate  | uint256 | undefined |

### FeesAccrued

```solidity
event FeesAccrued(uint256 amount)
```

event emitted when fees are accrued



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |

### LiquidationMultiplierUpdated

```solidity
event LiquidationMultiplierUpdated(uint256 oldVal, uint256 newVal)
```

event emitted when the liquidation mutiplier is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldVal  | uint256 | undefined |
| newVal  | uint256 | undefined |

### OracleDataUpdated

```solidity
event OracleDataUpdated()
```

oracle data updated




### OwnershipAccepted

```solidity
event OwnershipAccepted(address indexed newOwner)
```

event emitted when contract new ownership is accepted



#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner `indexed` | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed oldOwner, address indexed newOwner)
```

event emitted when contract ownership transferal was initated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |



