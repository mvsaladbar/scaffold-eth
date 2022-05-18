# IPandoraUSD









## Methods

### burn

```solidity
function burn(uint256 _amount, uint8 _decimals) external nonpayable
```

burns token from sender



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | the amount of tokens to be burnt
| _decimals | uint8 | amount&#39;s decimals

### burnFrom

```solidity
function burnFrom(address _user, uint256 _amount, uint8 _decimals) external nonpayable
```

burns token from an address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _user | address | the user to burn it from
| _amount | uint256 | the amount of tokens to be burnt
| _decimals | uint8 | amount&#39;s decimals

### managerContainer

```solidity
function managerContainer() external view returns (contract IManagerContainer)
```

interface of the manager container contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IManagerContainer | undefined

### mint

```solidity
function mint(address _to, uint256 _amount, uint8 _decimals) external nonpayable
```

mint tokens

*no need to check if &#39;_to&#39; is a valid address if the &#39;_mint&#39; method is used*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _to | address | address of the user receiving minted tokens
| _amount | uint256 | the amount to be minted
| _decimals | uint8 | amount&#39;s decimals

### mintLimit

```solidity
function mintLimit() external view returns (uint256)
```

returns the max mint limitF




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### totalMinted

```solidity
function totalMinted() external view returns (uint256)
```

returns total minted so far




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### updateMintLimit

```solidity
function updateMintLimit(uint256 _limit) external nonpayable
```

sets the manager address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _limit | uint256 | the new mint limit



## Events

### MintLimitUpdated

```solidity
event MintLimitUpdated(uint256 oldLimit, uint256 newLimit)
```

event emitted when the mint limit is updated



#### Parameters

| Name | Type | Description |
|---|---|---|
| oldLimit  | uint256 | undefined |
| newLimit  | uint256 | undefined |



