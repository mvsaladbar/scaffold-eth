// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/yearn/IYearnVault.sol";

contract YearnOracle is IOracle {
    // Calculates the lastest exchange rate
    function _get(address vault) public view returns (uint256 rate) {
        require(vault != address(0), "3048");
        rate = IYearnVault(vault).pricePerShare();
        uint256 decimals = IYearnVault(vault).decimals();
        if (decimals <= 18) {
            rate *= 10 ** (18 - decimals);
        } else {
            rate /= 10 ** (decimals - 18);
        }
    }

    //Converts the address of the vault into bytes
    function getDataParameter(address vault)
        external
        pure
        returns (bytes memory)
    {
        return abi.encode(vault);
    }

    // Get the latest exchange rate
    function get(bytes calldata data)
        external
        view
        override
        returns (bool, uint256)
    {
        address vault = abi.decode(data, (address));
        return (true, _get(vault));
    }

    // Check the last exchange rate without any state changes
    function peek(bytes calldata data)
        public
        view
        override
        returns (bool, uint256)
    {
        address vault = abi.decode(data, (address));
        return (true, _get(vault));
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
        return "Yearn";
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "Yearn";
    }
}
