// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/oracle/IOracle.sol";
import "../interfaces/oracle/IModChainlinkOracle.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "../libraries/UniswapV2Library.sol";
import "../libraries/UniswapV2OracleLibrary.sol";

contract TwapUniswapV2Oracle is IOracle {
    /// @notice  price oracle
    IModChainlinkOracle public immutable priceOracle;

    /// @dev the latestAnser returned
    uint256 private latestAnswer;

    /// @notice period for recomputing the average price
    uint256 public period = 24 hours;

    /// @notice uniswapv2 pair
    IUniswapV2Pair public immutable pair;

    /// @dev return true if baseToken is the firstToken of uniswapv2 pair
    bool public isFirstToken;

    /// @notice address to principal token of uniswapv2 pair
    address public immutable principalToken;

    /// @notice address to base token of uniswapv2 pair
    address public immutable baseToken;

    /// @dev uniswapv2pair accumulated price value (1 / 0)
    uint256 public price0CumulativeLast;

    /// @dev uniswapv2pair accumulated price value (0 / 1)
    uint256 public price1CumulativeLast;

    /// @dev blockTimestamp for latest updated
    uint32 public blockTimestampLast;

    /// @dev return average price of firstToken in uniswapv2 pair
    uint256 public price0Average;

    /// @dev return average price of secondToken in uniswapv2 pair
    uint256 public price1Average;

    /// @notice Price update event
    /// @param asset the asset
    /// @param newPrice price of the asset
    event PriceUpdated(address asset, uint256 newPrice);

    constructor(
        address _factory,
        address _principalToken,
        address _baseToken,
        address _priceOracle,
        uint256 _period
    ) {
        require(_priceOracle != address(0), "3053");
        require(_factory != address(0), "3054");
        require(_principalToken != address(0), "3055");
        require(_baseToken != address(0), "3056");
        require(_period > 0, "3057");

        priceOracle = IModChainlinkOracle(_priceOracle);
        IUniswapV2Pair _pair = IUniswapV2Pair(
            UniswapV2Library.pairFor(_factory, _principalToken, _baseToken)
        );
        require(address(_pair) != address(0), "3058");

        pair = _pair;
        period = _period;
        baseToken = _baseToken;
        principalToken = _principalToken;
        price0CumulativeLast = _pair.price0CumulativeLast();
        price1CumulativeLast = _pair.price1CumulativeLast();
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, "3059");

        if (_baseToken == _pair.token0()) {
            isFirstToken = true;
        } else {
            isFirstToken = false;
        }
    }

    /// @dev update the cumulative price for the observation at the current timestamp. each observation is updated at most
    /// once per epoch period.
    function update() public {
        (
            uint256 price0Cumulative,
            uint256 price1Cumulative,
            uint32 blockTimestamp
        ) = UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        // ensure that at least one full period has passed since the last update
        if (timeElapsed >= period) {
            // overflow is desired, casting never truncates
            // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
            price0Average = uint256(
                (1e18 * (price0Cumulative - price0CumulativeLast)) /
                    (uint256(timeElapsed))
            );
            price1Average = uint256(
                (1e18 * (price1Cumulative - price1CumulativeLast)) /
                    (uint256(timeElapsed))
            );

            price0CumulativeLast = price0Cumulative;
            price1CumulativeLast = price1Cumulative;
            blockTimestampLast = blockTimestamp;
        }
    }

    /// @dev update usd price of oracle asset
    function get(bytes calldata)
        external
        override
        returns (bool success, uint256 price)
    {
        update();

        bytes memory oracleData = priceOracle.getDataParameter(baseToken);
        (, uint256 baseTokenPrice) = priceOracle.get(oracleData);
        uint256 baseTokenPriceDecimals = 18; // Oracle should always return 18 decimals
        require(baseTokenPrice != 0, "3060");

        uint256 principalTokenDecimals = IERC20Metadata(principalToken)
            .decimals();
        uint256 baseTokenDecimals = IERC20Metadata(baseToken).decimals();
        uint256 pricePrincipalAverage = isFirstToken
            ? price1Average
            : price0Average;
        require(pricePrincipalAverage > 0, "3061");

        price =
            (pricePrincipalAverage * baseTokenPrice) /
            (10 **
                (18 +
                    baseTokenDecimals -
                    principalTokenDecimals +
                    baseTokenPriceDecimals)); // should be divide by 1e18
        latestAnswer = price;
        success = true;
        emit PriceUpdated(principalToken, price);
    }

    /// @return usd price in 1e8 decimals
    function peek(bytes calldata)
        external
        view
        override
        returns (bool, uint256)
    {
        return (true, latestAnswer);
    }

    function peekSpot(bytes calldata)
        external
        view
        override
        returns (uint256 rate)
    {
        return latestAnswer;
    }

    function symbol(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "TWAP USV2";
    }

    function name(bytes calldata)
        external
        pure
        override
        returns (string memory)
    {
        return "TWAP Uniswap V2";
    }
}
