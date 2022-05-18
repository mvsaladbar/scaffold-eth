// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./IOracle.sol";

interface IModChainlinkOracle is IOracle{
    event AggregatorAdded(address token, address aggregator);

    function aggregators(address token) external view returns (address);

    function getDataParameter(address token)
        external
        view
        returns (bytes memory);
}
