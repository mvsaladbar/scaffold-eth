# IManager

*Cosmin Grigore (@gcosmintech)*

> Interface for a the manager contract





## Methods

### BORROW_FEE_PRECISION

```solidity
function BORROW_FEE_PRECISION() external view returns (uint256)
```

fee taken when a stablecoin borrow operation is done

*can be 0*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### COLLATERALIZATION_PRECISION

```solidity
function COLLATERALIZATION_PRECISION() external view returns (uint256)
```



*should be less than exchange rate precision due to optimization in math*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### EXCHANGE_RATE_PRECISION

```solidity
function EXCHANGE_RATE_PRECISION() external view returns (uint256)
```

exchange rate precision




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### LIQUIDATION_MAX_LOSS_PRECISION

```solidity
function LIQUIDATION_MAX_LOSS_PRECISION() external view returns (uint256)
```

precision used to calculate max accepted loss in case of liquidation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### LIQUIDATION_MULTIPLIER_PRECISION

```solidity
function LIQUIDATION_MULTIPLIER_PRECISION() external view returns (uint256)
```

used in liquidation operation




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### MINIMUM_SHARE_BALANCE

```solidity
function MINIMUM_SHARE_BALANCE() external view returns (uint256)
```

share balance for token

*to prevent the ratio going off*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### USDC

```solidity
function USDC() external view returns (address)
```

USDC address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### blacklistContract

```solidity
function blacklistContract(address _contract) external nonpayable
```

removes a contract from the whitelisted list



#### Parameters

| Name | Type | Description |
|---|---|---|
| _contract | address | contract&#39;s address

### dexManager

```solidity
function dexManager() external view returns (address)
```

returns the available dex manager




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### feeAddress

```solidity
function feeAddress() external view returns (address)
```

returns the fee address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### firstDepositAmount

```solidity
function firstDepositAmount() external view returns (uint256)
```

Amount necessary to deposit for a user to grab a holding




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### holdingManager

```solidity
function holdingManager() external view returns (address)
```

returns holding manager address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### isContractWhitelisted

```solidity
function isContractWhitelisted(address _contract) external view returns (bool)
```

returns true/false for contracts&#39; whitelist status



#### Parameters

| Name | Type | Description |
|---|---|---|
| _contract | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### isTokenWhitelisted

```solidity
function isTokenWhitelisted(address _token) external view returns (bool)
```

returns true/false for token&#39;s whitelist status



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined

### maxAvailableHoldings

```solidity
function maxAvailableHoldings() external view returns (uint256)
```

returns the max amount of available holdings




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### mintingTokenReward

```solidity
function mintingTokenReward() external view returns (uint256)
```

returns the amount of protocol tokens         rewarded for pre-minting a holding contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### performanceFee

```solidity
function performanceFee() external view returns (uint256)
```

returns the default performance fee




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### protocolToken

```solidity
function protocolToken() external view returns (address)
```

returns the protocol token address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### removeToken

```solidity
function removeToken(address _token) external nonpayable
```

removes a token from whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token&#39;s address

### setDexManager

```solidity
function setDexManager(address _dex) external nonpayable
```

updates the dex manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _dex | address | dex manager&#39;s address

### setFeeAddress

```solidity
function setFeeAddress(address _fee) external nonpayable
```

updates the fee address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _fee | address | the new address

### setFirstDepositAmount

```solidity
function setFirstDepositAmount(uint256 _amount) external nonpayable
```

sets the amount necessary to deposit for a user to grab a holding



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | amount of USDC that will be deposited

### setHoldingManager

```solidity
function setHoldingManager(address _holding) external nonpayable
```

sets the holding manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _holding | address | strategy&#39;s address

### setMaxAvailableHoldings

```solidity
function setMaxAvailableHoldings(uint256 _amount) external nonpayable
```

sets the max amount of available holdings



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | max amount of available holdings

### setMintingTokenReward

```solidity
function setMintingTokenReward(uint256 _amount) external nonpayable
```

sets the protocol token reward for pre-minting holdings



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | protocol token amount

### setPerformanceFee

```solidity
function setPerformanceFee(uint256 _fee) external nonpayable
```

sets the performance fee



#### Parameters

| Name | Type | Description |
|---|---|---|
| _fee | uint256 | fee amount

### setProtocolToken

```solidity
function setProtocolToken(address _protocolToken) external nonpayable
```

sets the protocol token address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _protocolToken | address | protocol token address

### setStablecoinManager

```solidity
function setStablecoinManager(address _stables) external nonpayable
```

sets the stablecoin manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _stables | address | strategy&#39;s address

### setStrategyManager

```solidity
function setStrategyManager(address _strategy) external nonpayable
```

updates the strategy manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _strategy | address | strategy manager&#39;s address

### stablesManager

```solidity
function stablesManager() external view returns (address)
```

returns stablecoin manager address




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### strategyManager

```solidity
function strategyManager() external view returns (address)
```

returns the available strategy manager




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### whitelistContract

```solidity
function whitelistContract(address _contract) external nonpayable
```

whitelists a contract



#### Parameters

| Name | Type | Description |
|---|---|---|
| _contract | address | contract&#39;s address

### whitelistToken

```solidity
function whitelistToken(address _token) external nonpayable
```

whitelists a token



#### Parameters

| Name | Type | Description |
|---|---|---|
| _token | address | token&#39;s address



## Events

### ContractBlacklisted

```solidity
event ContractBlacklisted(address indexed contractAddress)
```

emitted when a contract is removed from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| contractAddress `indexed` | address | undefined |

### ContractWhitelisted

```solidity
event ContractWhitelisted(address indexed contractAddress)
```

emitted when a new contract is whitelisted



#### Parameters

| Name | Type | Description |
|---|---|---|
| contractAddress `indexed` | address | undefined |

### DexManagerUpdated

```solidity
event DexManagerUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the dex manager is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### FeeAddressUpdated

```solidity
event FeeAddressUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the fee address is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### FirstDepositAmountUpdated

```solidity
event FirstDepositAmountUpdated(uint256 indexed oldAmount, uint256 indexed newAmount)
```

emitted when the first deposit amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAmount `indexed` | uint256 | undefined |
| newAmount `indexed` | uint256 | undefined |

### HoldingManagerUpdated

```solidity
event HoldingManagerUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the holding manager is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### MaxAvailableHoldingsUpdated

```solidity
event MaxAvailableHoldingsUpdated(uint256 indexed oldFee, uint256 indexed newFee)
```

emitted when the max amount of available holdings is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldFee `indexed` | uint256 | undefined |
| newFee `indexed` | uint256 | undefined |

### MintingTokenRewardUpdated

```solidity
event MintingTokenRewardUpdated(uint256 indexed oldFee, uint256 indexed newFee)
```

emitted when the protocol token reward for minting is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldFee `indexed` | uint256 | undefined |
| newFee `indexed` | uint256 | undefined |

### PerformanceFeeUpdated

```solidity
event PerformanceFeeUpdated(uint256 indexed oldFee, uint256 indexed newFee)
```

emitted when the default fee is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldFee `indexed` | uint256 | undefined |
| newFee `indexed` | uint256 | undefined |

### ProtocolTokenUpdated

```solidity
event ProtocolTokenUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the protocol token address is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### StablecoinManagerUpdated

```solidity
event StablecoinManagerUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the stablecoin manager is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### StrategyManagerUpdated

```solidity
event StrategyManagerUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the strategy manager is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |

### TokenRemoved

```solidity
event TokenRemoved(address indexed token)
```

emitted when a new token is removed from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |

### TokenWhitelisted

```solidity
event TokenWhitelisted(address indexed token)
```

emitted when a new token is whitelisted



#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |

### USDCAddressUpdated

```solidity
event USDCAddressUpdated(address indexed oldAddress, address indexed newAddress)
```

emitted when the USDC address is changed



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldAddress `indexed` | address | undefined |
| newAddress `indexed` | address | undefined |



