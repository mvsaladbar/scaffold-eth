// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/oracle/IAggregator.sol";

contract ChainlinkOracle is IOracle {
    // Calculates the lastest exchange rate
    // Uses both divide and multiply only for tokens not supported directly by Chainlink, for example MKR/USD
    function _get(
        address multiply,
        address divide,
        uint256 decimals
    ) public view returns (uint256) {
        uint256 price = uint256(1e18);
        if (multiply != address(0)) {
            // We only care about the second value - the price
            (, int256 priceC, , , ) = IAggregator(multiply).latestRoundData();
            price = price * uint256(priceC);
        } else {
            price = price * 1e18;
        }

        if (divide != address(0)) {
            // We only care about the second value - the price
            (, int256 priceC, , , ) = IAggregator(divide).latestRoundData();
            price = price / uint256(priceC);
        }

        return price / decimals;
    }

    function getDataParameter(
        address multiply,
        address divide,
        uint256 decimals
    ) external pure returns (bytes memory) {
        return abi.encode(multiply, divide, decimals);
    }

    // Get the latest exchange rate
    function get(bytes calldata data) external view override returns (bool, uint256) {
        (address multiply, address divide, uint256 decimals) = abi.decode(
            data,
            (address, address, uint256)
        );
        return (true, _get(multiply, divide, decimals));
    }

    // Check the last exchange rate without any state changes
    function peek(bytes calldata data)
        public
        view
        override
        returns (bool, uint256)
    {
        (address multiply, address divide, uint256 decimals) = abi.decode(
            data,
            (address, address, uint256)
        );
        return (true, _get(multiply, divide, decimals));
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

    function name(bytes calldata) external pure override returns (string memory) {
        return "Chainlink";
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "LINK";
    }
}
