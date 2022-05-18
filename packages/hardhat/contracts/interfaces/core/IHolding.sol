// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IManagerContainer.sol";

interface IHolding {
    // @notice returns the manager address
    function managerContainer() external view returns (IManagerContainer);

    /// @notice approves an amount of a token to another address
    /// @param _tokenAddress token user wants to withdraw
    /// @param _destination destination address of the approval
    /// @param _amount withdrawal amount
    function approve(
        address _tokenAddress,
        address _destination,
        uint256 _amount
    ) external;

    /// @notice generic caller for contract
    /// @dev callable only by HoldingManager or StrategyManager to avoid risky situations
    /// @dev used mostly for claim rewards part of the strategies as only the registered staker can harvest
    /// @param _contract the contract address for which the call will be invoked
    /// @param _call abi.encodeWithSignature data for the call
    function genericCall(address _contract, bytes calldata _call)
        external
        returns (bool success, bytes memory result);

    /// @dev used when shares are claimed from strategies
    /// @param _token token address
    /// @param _to address to move token to
    /// @param _amount transferal amount
    function transfer(
        address _token,
        address _to,
        uint256 _amount
    ) external;
}
