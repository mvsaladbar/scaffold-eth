// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStrategyManagerMin {
    /// @notice returns whitelisted strategies
    function strategyInfo(address _strategy)
        external
        view
        returns (
            uint256,
            bool,
            bool
        );
}
