// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/core/IManager.sol";

import "./libraries/OperationsLib.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Contract holding configuration for everything
/// @author Cosmin Grigore (@gcosmintech)
contract Manager is IManager, Ownable {
    /// @notice returns holding manager address
    address public override holdingManager;

    /// @notice returns stablecoin manager address
    address public override stablesManager;

    /// @notice returns the available strategy manager
    address public override strategyManager;

    /// @notice returns the available dex manager
    address public override dexManager;

    /// @notice returns the protocol token address
    address public override protocolToken;

    /// @notice returns the default performance fee
    uint256 public override performanceFee = 100; //1%

    /// @notice returns the fee address
    address public override feeAddress;

    /// @notice USDC address
    // solhint-disable-next-line var-name-mixedcase
    address public immutable override USDC;

    /// @notice Amount necessary to deposit for a user to grab a holding
    uint256 public override firstDepositAmount = 500 * 1e6; // 500 USDC

    /// @notice returns the amount of protocol tokens
    ///         rewarded for pre-minting a holding contract
    uint256 public override mintingTokenReward = 10**8; //TODO Change placeholder value

    /// @notice returns the max amount of available holdings
    uint256 public override maxAvailableHoldings = 100; //TODO Change placeholder value

    /// @notice returns true/false for contracts' whitelist status
    mapping(address => bool) public override isContractWhitelisted;

    /// @notice returns true if token is whitelisted
    mapping(address => bool) public override isTokenWhitelisted;

    /// @notice represents the collateral rate precision
    /// @dev should be less than exchange rate precision due to optimization in math
    uint256 public constant override COLLATERALIZATION_PRECISION = 1e5;
    /// @notice exchange rate precision
    uint256 public constant override EXCHANGE_RATE_PRECISION = 1e18;
    /// @notice used in liquidation operation
    uint256 public constant override LIQUIDATION_MULTIPLIER_PRECISION = 1e5;
    /// @notice fee taken when a stablecoin borrow operation is done
    /// @dev can be 0
    uint256 public constant override BORROW_FEE_PRECISION = 1e5;
    /// @notice share balance for token
    /// @dev to prevent the ratio going off
    uint256 public constant override MINIMUM_SHARE_BALANCE = 1000;
    /// @notice precision used to calculate max accepted loss in case of liquidation
    uint256 public constant override LIQUIDATION_MAX_LOSS_PRECISION = 1e5;

    /// @notice creates a new Manager contract
    /// @param _usdc the USDC address
    constructor(address _usdc) {
        USDC = _usdc;
    }

    /// @notice Sets the global fee address
    /// @param _val The address of the receiver.
    function setFeeAddress(address _val)
        external
        override
        onlyOwner
        validAddress(_val)
    {
        require(feeAddress != _val, "3017");
        emit FeeAddressUpdated(feeAddress, _val);
        feeAddress = _val;
    }

    /// @notice updates the strategy manager address
    /// @param _strategy strategy manager's address
    function setStrategyManager(address _strategy)
        external
        override
        onlyOwner
        validAddress(_strategy)
    {
        require(strategyManager != _strategy, "3017");
        emit StrategyManagerUpdated(strategyManager, _strategy);
        strategyManager = _strategy;
    }

    /// @notice updates the dex manager address
    /// @param _dex dex manager's address
    function setDexManager(address _dex)
        external
        override
        onlyOwner
        validAddress(_dex)
    {
        require(dexManager != _dex, "3017");
        emit DexManagerUpdated(dexManager, _dex);
        dexManager = _dex;
    }

    /// @notice sets the holding manager address
    /// @param _holding strategy's address
    function setHoldingManager(address _holding)
        external
        override
        onlyOwner
        validAddress(_holding)
    {
        require(holdingManager != _holding, "3017");
        emit HoldingManagerUpdated(holdingManager, _holding);
        holdingManager = _holding;
    }

    /// @notice sets the stablecoin manager address
    /// @param _stables strategy's address
    function setStablecoinManager(address _stables)
        external
        override
        onlyOwner
        validAddress(_stables)
    {
        require(stablesManager != _stables, "3017");
        emit StablecoinManagerUpdated(stablesManager, _stables);
        stablesManager = _stables;
    }

    /// @notice sets the protocol token address
    /// @param _protocolToken protocol token address
    function setProtocolToken(address _protocolToken)
        external
        override
        onlyOwner
        validAddress(_protocolToken)
    {
        require(protocolToken != _protocolToken, "3017");
        emit ProtocolTokenUpdated(protocolToken, _protocolToken);
        protocolToken = _protocolToken;
    }

    /// @notice sets the performance fee
    /// @dev should be less than FEE_FACTOR
    /// @param _fee fee amount
    function setPerformanceFee(uint256 _fee)
        external
        override
        onlyOwner
        validAmount(_fee)
    {
        require(_fee < OperationsLib.FEE_FACTOR, "3018");
        emit PerformanceFeeUpdated(performanceFee, _fee);
        performanceFee = _fee;
    }

    /// @notice sets the protocol token reward for pre-minting holdings
    /// @param _amount protocol token amount
    function setMintingTokenReward(uint256 _amount)
        external
        override
        onlyOwner
        validAmount(_amount)
    {
        emit MintingTokenRewardUpdated(mintingTokenReward, _amount);
        mintingTokenReward = _amount;
    }

    /// @notice sets the max amount of available holdings
    /// @param _amount max amount of available holdings
    function setMaxAvailableHoldings(uint256 _amount)
        external
        override
        onlyOwner
        validAmount(_amount)
    {
        emit MaxAvailableHoldingsUpdated(maxAvailableHoldings, _amount);
        maxAvailableHoldings = _amount;
    }

    /// @notice sets the amount necessary to deposit for a user to grab a holding
    /// @param _amount amount of USDC that will be deposited
    function setFirstDepositAmount(uint256 _amount)
        external
        override
        onlyOwner
        validAmount(_amount)
    {
        emit FirstDepositAmountUpdated(firstDepositAmount, _amount);
        firstDepositAmount = _amount;
    }

    /// @notice whitelists a contract
    /// @param _contract contract's address
    function whitelistContract(address _contract)
        external
        override
        onlyOwner
        validAddress(_contract)
    {
        require(!isContractWhitelisted[_contract], "3019");
        isContractWhitelisted[_contract] = true;
        emit ContractWhitelisted(_contract);
    }

    /// @notice removes a contract from the whitelisted list
    /// @param _contract contract's address
    function blacklistContract(address _contract)
        external
        override
        onlyOwner
        validAddress(_contract)
    {
        require(isContractWhitelisted[_contract], "1000");
        isContractWhitelisted[_contract] = false;
        emit ContractBlacklisted(_contract);
    }

    /// @notice whitelists a token
    /// @param _token token's address
    function whitelistToken(address _token)
        external
        override
        onlyOwner
        validAddress(_token)
    {
        require(!isTokenWhitelisted[_token], "3019");
        isTokenWhitelisted[_token] = true;
        emit TokenWhitelisted(_token);
    }

    /// @notice removes a token from whitelist
    /// @param _token token's address
    function removeToken(address _token)
        external
        override
        onlyOwner
        validAddress(_token)
    {
        require(isTokenWhitelisted[_token], "1000");
        isTokenWhitelisted[_token] = false;
        emit TokenRemoved(_token);
    }

    // -- modifiers --

    modifier validAddress(address _address) {
        require(_address != address(0), "3000");
        _;
    }
    modifier validAmount(uint256 _amount) {
        require(_amount > 0, "2001");
        _;
    }
}
