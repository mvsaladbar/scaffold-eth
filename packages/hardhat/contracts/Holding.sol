// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./libraries/OperationsLib.sol";

import "./interfaces/core/IHolding.sol";
import "./interfaces/core/IManager.sol";
import "./interfaces/core/IStrategyManagerMin.sol";

contract Holding is IHolding {
    using SafeERC20 for IERC20;

    /// @notice returns the managerContainer address
    IManagerContainer public immutable override managerContainer;

    /// @notice Constructor
    /// @param _managerContainer contract that contains the address of the manager contract
    constructor(address _managerContainer) {
        require(_managerContainer != address(0), "3065");
        managerContainer = IManagerContainer(_managerContainer);
    }

    /// @notice approves an amount of a token to another address
    /// @param _tokenAddress token user wants to withdraw
    /// @param _destination destination address of the approval
    /// @param _amount withdrawal amount
    function approve(
        address _tokenAddress,
        address _destination,
        uint256 _amount
    ) external override onlyAllowed {
        uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
        require(balance >= _amount, "2002");

        OperationsLib.safeApprove(_tokenAddress, _destination, _amount);
    }

    /// @notice generic caller for contract
    /// @dev callable only by HoldingManager, StrategyManager or the strategies to avoid risky situations
    /// @dev used mostly for claim rewards part of the strategies as only the registered staker can harvest
    /// @param _contract the contract address for which the call will be invoked
    /// @param _call abi.encodeWithSignature data for the call
    function genericCall(address _contract, bytes calldata _call)
        external
        override
        onlyAllowed
        returns (bool success, bytes memory result)
    {
        //TODO: change with safeCall but compare the gas cost before & after; not really needed since the called contracts are limited and we know what to expect
        // solhint-disable-next-line avoid-low-level-calls
        (success, result) = _contract.call(_call);
    }

    /// @notice transfers token to another address
    /// @dev used when shares are claimed from strategies
    /// @param _token token address
    /// @param _to address to move token to
    /// @param _amount transferal amount
    function transfer(
        address _token,
        address _to,
        uint256 _amount
    ) external override onlyAllowed {
        uint256 _balance = IERC20(_token).balanceOf(address(this));
        require(_balance >= _amount, "2001");
        IERC20(_token).safeTransfer(_to, _amount);
    }

    modifier onlyAllowed() {
        IManager manager = IManager(managerContainer.manager());
        (, , bool isStrategyWhitelisted) = IStrategyManagerMin(
            manager.strategyManager()
        ).strategyInfo(msg.sender);
        require(
            msg.sender == manager.strategyManager() ||
                msg.sender == manager.holdingManager() ||
                isStrategyWhitelisted,
            "1000"
        );
        _;
    }
}
