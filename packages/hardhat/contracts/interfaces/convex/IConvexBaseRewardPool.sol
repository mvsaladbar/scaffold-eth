// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IConvexRewardPoolMin.sol";

/// @title Interface for the Convex booster
/// @author Cosmin Grigore (@gcosmintech)
interface IConvexBaseRewardPool is IConvexRewardPoolMin {
    function rewardToken() external view returns (address);

    function earned(address _user) external view returns (uint256);

    function rewards(address _user) external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function balanceOf(address _user) external view returns (uint256);

   
    function getReward(address _account, bool _claimExtras)
        external
        returns (bool);
}
