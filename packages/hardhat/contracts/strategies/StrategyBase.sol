// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/core/IStrategy.sol";
import "../interfaces/core/IManager.sol";
import "../interfaces/core/IManagerContainer.sol";
import "../interfaces/core/IStrategyManager.sol";

import "../libraries/OperationsLib.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title StrategyBase contract used for any Aave strategy
/// @author Cosmin Grigore (@gcosmintech)
abstract contract StrategyBase is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice emitted when a new underlying is added to the whitelist
    event UnderlyingAdded(address indexed newAddress);
    /// @notice emitted when a new underlying is removed from the whitelist
    event UnderlyingRemoved(address indexed old);
    /// @notice emitted when the address is updated
    event StrategyManagerUpdated(
        address indexed old,
        address indexed newAddress
    );
    /// @notice emitted when funds are saved in case of an emergency
    event SavedFunds(address indexed token, uint256 amount);

    /// @notice contract that contains the address of the manager contract
    IManagerContainer public managerContainer;

    /// @notice save funds
    /// @param _token token address
    /// @param _amount token amount
    function emergencySave(address _token, uint256 _amount)
        external
        onlyValidAddress(_token)
        onlyValidAmount(_amount)
        onlyOwner
    {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(_amount <= balance, "2005");
        IERC20(_token).safeTransfer(msg.sender, _amount);
        emit SavedFunds(_token, _amount);
    }

    function _getManager() internal view returns (IManager) {
        return IManager(managerContainer.manager());
    }

    function _getStrategyManager() internal view returns (IStrategyManager) {
        return IStrategyManager(_getManager().strategyManager());
    }

    modifier onlyStrategyManager() {
        require(msg.sender == _getManager().strategyManager(), "1000");
        _;
    }

    modifier onlyValidAmount(uint256 _amount) {
        require(_amount > 0, "2001");
        _;
    }

    modifier onlyValidAddress(address _addr) {
        require(_addr != address(0), "3000");
        _;
    }
}
