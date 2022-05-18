// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IConvexBoosterMin.sol";

/// @title Interface for the Convex booster
/// @author Cosmin Grigore (@gcosmintech)
interface IConvexBooster is IConvexBoosterMin {
    struct PoolInfo {
        address lptoken;
        address token;
        address gauge;
        address crvRewards;
        address stash;
        bool shutdown;
    }

    function isShutdown() external view returns (bool);

    function poolInfo(uint256 i) external view returns (PoolInfo memory);

    function poolLength() external view returns (uint256);
}
