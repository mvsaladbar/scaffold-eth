// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for the Convex booster
/// @author Cosmin Grigore (@gcosmintech)
interface IConvexBoosterMin {
    function deposit(
        uint256 _pid,
        uint256 _amount,
        bool _stake
    ) external returns (bool);

    function withdraw(uint256 _pid, uint256 _amount) external returns (bool);
}
