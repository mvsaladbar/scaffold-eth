// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../interfaces/oracle/IModChainlinkOracle.sol";
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/IUniswapV2Pair.sol";

contract SimpleUniswapOracleV2 is IOracle {

    IModChainlinkOracle public baseOracle;

    constructor(address _baseOracle) {
        baseOracle = IModChainlinkOracle(_baseOracle);
    }

    // Calculates the lastest exchange rate
    function _get(address pair) public view returns (uint256 rate) {
        require(pair != address(0), "3058");
        address token0 = IUniswapV2Pair(pair).token0();
        address token1 = IUniswapV2Pair(pair).token1();
        uint256 totalSupply = IUniswapV2Pair(pair).totalSupply();
        (uint256 r0, uint256 r1, ) = IUniswapV2Pair(pair).getReserves();
        bytes memory token0OracleData = baseOracle.getDataParameter(token0);
        bytes memory token1OracleData = baseOracle.getDataParameter(token1);
        uint256 token0Price = baseOracle.peekSpot(token0OracleData);
        uint256 token1Price = baseOracle.peekSpot(token1OracleData);
        rate = ((token0Price * r0) + (token1Price * r1)) / totalSupply;
    }

    function getDataParameter(address pair) external pure returns (bytes memory) {
        return abi.encode(pair);
    }

    // Get the latest exchange rate
    function get(bytes calldata data) external view override returns (bool, uint256) {
        address pair = abi.decode(data, (address));
        return (true, _get(pair));
    }

    // Check the last exchange rate without any state changes
    function peek(bytes calldata data)
        public
        view
        override
        returns (bool, uint256)
    {
        address pair = abi.decode(data, (address));
        return (true, _get(pair));
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
        return "Uniswap";
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "UNI";
    }
}
