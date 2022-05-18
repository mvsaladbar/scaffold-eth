// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for the Aave Lending pool
/// @author Cosmin Grigore (@gcosmintech)
interface IAaveLendingPool {
    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}
