// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/curve/ICurvePriceGetter.sol";

contract CurveOracle is IOracle {
    // Calculates the lastest exchange rate
    function _get(address pool) public view returns (uint256 rate) {
        require(pool != address(0), "3064");
        return ICurvePriceGetter(pool).get_virtual_price();
    }

    //Converts the address of the pool into bytes
    function getDataParameter(address pool)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(pool);
    }

    // Get the latest exchange rate
    function get(bytes calldata data)
        external
        view
        override
        returns (bool, uint256)
    {
        address pool = abi.decode(data, (address));
        return (true, _get(pool));
    }

    // Check the last exchange rate without any state changes
    function peek(bytes calldata data)
        public
        view
        override
        returns (bool, uint256)
    {
        address pool = abi.decode(data, (address));
        return (true, _get(pool));
    }

    // Check the last exchange rate without any state changes
    function peekSpot(bytes calldata data)
        external
        view
        override
        returns (uint256)
    {
        (, uint256 rate) = peek(data);
        return rate;
    }

    function name(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "Curve-fi";
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "CRV";
    }
}
