// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IUniswapV2Pair.sol";

////////////////////////////////////////////////////////////////////////////////////////////
/// @title UniswapV2Library
/// @author uniswap
////////////////////////////////////////////////////////////////////////////////////////////

library UniswapV2OracleLibrary {
    // helper function that returns the current block timestamp within the range of uint32, i.e. [0, 2**32 - 1]
    function currentBlockTimestamp() internal view returns (uint32) {
        return uint32(block.timestamp % (2**32));
    }

    // produces the cumulative price using counterfactuals to save gas and avoid a call to sync.
    function currentCumulativePrices(address pair)
        internal
        view
        returns (
            uint256 price0Cumulative,
            uint256 price1Cumulative,
            uint32 blockTimestamp
        )
    {
        blockTimestamp = currentBlockTimestamp();
        price0Cumulative = IUniswapV2Pair(pair).price0CumulativeLast();
        price1Cumulative = IUniswapV2Pair(pair).price1CumulativeLast();

        // if time has elapsed since the last update on the pair, mock the accumulated price values
        (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        ) = IUniswapV2Pair(pair).getReserves();
        if (blockTimestampLast != blockTimestamp) {
            // subtraction overflow is desired
            uint32 timeElapsed = blockTimestamp - blockTimestampLast;
            // addition overflow is desired

            // counterfactual
            int256 ratio0 = (1e18 * int256(uint256(reserve1))) /
                int256(uint256(reserve0));
            price0Cumulative += uint256(ratio0) * uint256(timeElapsed);

            // counterfactual
            int256 ratio1 = (1e18 * int256(uint256(reserve0))) /
                int256(uint256(reserve1));
            price1Cumulative += uint256(ratio1) * uint256(timeElapsed);
        }
    }
}
