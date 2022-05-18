// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../interfaces/oracle/IModChainlinkOracle.sol";
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "../libraries/Babylonian.sol";

contract FairUniswapOracleV2 is IOracle {

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
        uint256 sqrtReserves = Babylonian.sqrt(r0 * r1);
        uint256 sqrtPrices = Babylonian.sqrt(token0Price*token1Price);
        rate = 2*(sqrtReserves * sqrtPrices) / totalSupply;
    }

    function getDataParameter(address pair) public pure returns (bytes memory) {
        return abi.encode(pair);
    }

    // Get the latest exchange rate
    function get(bytes calldata data) public view override returns (bool, uint256) {
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
        public
        view
        override
        returns (uint256)
    {
        (, uint256 rate) = peek(data);
        return rate;
    }

    function name(bytes calldata) public pure override returns (string memory) {
        return "Uniswap";
    }

    function symbol(bytes calldata)
        public
        pure
        override
        returns (string memory)
    {
        return "UNI";
    }
}
