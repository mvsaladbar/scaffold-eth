// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../interfaces/core/IStablesManager.sol";
import "../interfaces/core/IManager.sol";
import "../interfaces/stablecoin/IPandoraUSD.sol";

/// @title Pandora stablecoin
/// @author Cosmin Grigore (@gcosmintech)
contract PandoraUSD is IPandoraUSD, ERC20 {
    /// @notice token's symbol
    string private constant SYMBOL = "pUSD";
    /// @notice token's name
    string private constant NAME = "Pandora USD";
    /// @notice token's decimals
    uint8 private constant DECIMALS = 18;

    /// @notice contract that contains the address of the manager contract
    IManagerContainer public immutable override managerContainer;

    /// @notice mint limit
    uint256 public override mintLimit;

    /// @notice total minted so far
    uint256 public override totalMinted;

    address private _owner;

    /// @notice creates the pUsd contract
    /// @param _managerContainer contract that contains the address of the manager contract
    constructor(address _managerContainer) ERC20(NAME, SYMBOL) {
        require(_managerContainer != address(0), "3065");
        managerContainer = IManagerContainer(_managerContainer);
        _owner = msg.sender;
        mintLimit = 1000000 * 1e18; // initial 1M limit
    }

    // -- Owner specific methods --
    /// @notice sets the manager address
    /// @param _limit the new mint limit
    function updateMintLimit(uint256 _limit)
        external
        override
        onlyOwnerOrStablesManager
        validAmount(_limit)
    {
        emit MintLimitUpdated(mintLimit, _limit);
        mintLimit = _limit;
    }

    // -- Write type methods --

    /// @notice mint tokens
    /// @dev no need to check if '_to' is a valid address if the '_mint' method is used
    /// @param _to address of the user receiving minted tokens
    /// @param _amount the amount to be minted
    /// @param _decimals amount's decimals
    function mint(
        address _to,
        uint256 _amount,
        uint8 _decimals
    ) external override onlyOwnerOrStablesManager validAmount(_amount) {
        _amount = _fixAmount(_amount, _decimals);
        require(totalMinted + _amount <= mintLimit, "2007");
        totalMinted += _amount;
        _mint(_to, _amount);
    }

    /// @notice burns token from sender
    /// @param _amount the amount of tokens to be burnt
    /// @param _decimals amount's decimals
    function burn(uint256 _amount, uint8 _decimals)
        external
        override
        validAmount(_amount)
    {
        _amount = _fixAmount(_amount, _decimals);
        totalMinted -= _amount;
        _burn(msg.sender, _amount);
    }

    /// @notice burns token from an address
    /// @param _user the user to burn it from
    /// @param _amount the amount of tokens to be burnt
    /// @param _decimals amount's decimals
    function burnFrom(
        address _user,
        uint256 _amount,
        uint8 _decimals
    ) external override validAmount(_amount) onlyOwnerOrStablesManager {
        _amount = _fixAmount(_amount, _decimals);
        totalMinted -= _amount;
        _burn(_user, _amount);
    }

    /// @dev transforms _amount to 18 decimals _amount
    function _fixAmount(uint256 _amount, uint8 _decimals)
        private
        pure
        returns (uint256 _realAmount)
    {
        _realAmount = _amount;
        if (_decimals < 18) {
            _realAmount = _amount * (10**(18 - _decimals));
        } else if (_decimals > 18) {
            _realAmount = _amount / (10**(_decimals - 18));
        }
    }

    modifier validAddress(address _val) {
        require(_val != address(0), "3000");
        _;
    }
    modifier validAmount(uint256 _val) {
        require(_val > 0, "2001");
        _;
    }
    modifier onlyOwnerOrStablesManager() {
        require(
            _owner == msg.sender ||
                msg.sender ==
                IManager(managerContainer.manager()).stablesManager(),
            "1000"
        );
        _;
    }
}
