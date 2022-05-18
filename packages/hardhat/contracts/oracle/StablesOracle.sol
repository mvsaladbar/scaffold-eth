// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/oracle/IOracle.sol";

contract StablesOracle is IOracle {
    function get(bytes calldata)
        external
        pure
        override
        returns (bool success, uint256 rate)
    {
        return (true, 1e18);
    }

    function peek(bytes calldata)
        external
        pure
        override
        returns (bool success, uint256 rate)
    {
        return (true, 1e18);
    }

    function peekSpot(bytes calldata)
        external
        pure
        override
        returns (uint256 rate)
    {
        return 1e18;
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "STB";
    }

    function name(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "StablesOracle";
    }
}
