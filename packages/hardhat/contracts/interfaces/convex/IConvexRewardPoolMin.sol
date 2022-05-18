// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for the Convex booster
/// @author Cosmin Grigore (@gcosmintech)
interface IConvexRewardPoolMin {
    function withdrawAndUnwrap(uint256 _amount, bool claim)
        external
        returns (bool);
}
