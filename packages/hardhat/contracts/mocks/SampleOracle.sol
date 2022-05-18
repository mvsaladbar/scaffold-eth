// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/oracle/IOracle.sol";

contract SampleOracle is IOracle {
    uint256 public someNo;
    uint256 public price;

    constructor() {
        price = 1e18;
    }

    function setPriceForLiquidation() external {
        price = 5e17;
    }

    function get(bytes calldata)
        external
        override
        returns (bool success, uint256 rate)
    {
        someNo = 1; //to avoid "can be restricted to pure" compiler warning
        return (true, price);
    }

    function peek(bytes calldata data)
        external
        view
        override
        returns (bool success, uint256 rate)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function peekSpot(bytes calldata data)
        external
        view
        override
        returns (uint256 rate)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function symbol(bytes calldata data)
        external
        view
        override
        returns (string memory)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function name(bytes calldata data)
        external
        view
        override
        returns (string memory)
    // solhint-disable-next-line no-empty-blocks
    {

    }
}
