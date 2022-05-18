// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "../interfaces/oracle/IModChainlinkOracle.sol";
import "../interfaces/oracle/IModAggregator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ModChainlinkOracle is IModChainlinkOracle, Ownable {
    mapping(address => address) public override aggregators;


    constructor() {
        // WETH
        _addAggregator(
            0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
            0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        );

        // WBTC
        _addAggregator(
            0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599,
            0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c
        );

        // AAVE
        _addAggregator(
            0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9,
            0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012
        );

        // UNI
        _addAggregator(
            0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984,
            0x553303d460EE0afB37EdFf9bE42922D8FF63220e
        );

        // SUSHI
        _addAggregator(
            0x6B3595068778DD592e39A122f4f5a5cF09C90fE2,
            0xCc70F09A6CC17553b2E31954cD36E4A2d89501f7
        );

        // CRV
        _addAggregator(
            0xD533a949740bb3306d119CC777fa900bA034cd52,
            0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f
        );

        // MATIC
        _addAggregator(
            0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0,
            0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676
        );

        // COMP
        _addAggregator(
            0xc00e94Cb662C3520282E6f5717214004A7f26888,
            0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5
        );

        // LINK
        _addAggregator(
            0x514910771AF9Ca656af840dff83E8264EcF986CA,
            0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c
        );
    }

    function addAggregator(address _token, address _aggregator)
        public
        onlyOwner
    {
        require(_token != address(0), "3001");
        require(_aggregator != address(0), "3053");
        _addAggregator(_token, _aggregator);
    }

    function _addAggregator(address _token, address _aggregator) internal {
        aggregators[_token] = _aggregator;
        emit AggregatorAdded(_token, _aggregator);
    }

    // Calculates the lastest exchange rate
    function _get(address aggregator) public view returns (uint256 rate) {
        require(aggregator != address(0), "3053");
        int256 answer = IModAggregator(aggregator).latestAnswer();
        uint8 decimals = IModAggregator(aggregator).decimals();
        rate = (1e18 * uint256(answer)) / (10**uint256(decimals));
    }

    function getDataParameter(address token)
        external
        view
        override
        returns (bytes memory)
    {
        return abi.encode(aggregators[token]);
    }

    // Get the latest exchange rate
    function get(bytes calldata data) external view override returns (bool, uint256) {
        address aggregator = abi.decode(data, (address));
        return (true, _get(aggregator));
    }

    // Check the last exchange rate without any state changes
    function peek(bytes calldata data)
        public
        view
        override
        returns (bool, uint256)
    {
        address aggregator = abi.decode(data, (address));
        return (true, _get(aggregator));
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
        return "ModChainlink";
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "MLINK";
    }
}
