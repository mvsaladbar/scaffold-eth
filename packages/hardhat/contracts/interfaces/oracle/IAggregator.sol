// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Chainlink Aggregator
interface IAggregator {
    function latestRoundData()
        external
        view
        returns (
            uint80,
            int256 answer,
            uint256,
            uint256,
            uint80
        );
}
