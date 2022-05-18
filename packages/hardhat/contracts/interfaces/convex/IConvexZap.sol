// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for the Convex Zap claimer
/// @author Cosmin Grigore (@gcosmintech)
interface IConvexZap {
    function claimRewards(
        address[] calldata rewardContracts,
        address[] calldata extraRewardContracts,
        address[] calldata tokenRewardContracts,
        address[] calldata tokenRewardTokens,
        uint256 depositCrvMaxAmount,
        uint256 minAmountOut,
        uint256 depositCvxMaxAmount,
        uint256 spendCvxAmount,
        uint256 options
    ) external;
}
