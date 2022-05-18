// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for the Curve Tricrypto Liquidity Pool
/// @author Cosmin Grigore (@gcosmintech)
interface ICurveTricryptoLiquidityPool {
    function coins(uint256 i) external view returns (address);

    function token() external view returns (address);

    // solhint-disable-next-line func-name-mixedcase
    function add_liquidity(
        uint256[3] calldata amounts,
        // solhint-disable-next-line var-name-mixedcase
        uint256 min_mint_amount
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function remove_liquidity(
        uint256 _amount,
        // solhint-disable-next-line var-name-mixedcase
        uint256[3] calldata min_amounts
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function remove_liquidity_one_coin(
        // solhint-disable-next-line var-name-mixedcase
        uint256 _token_amount,
        uint256 i,
        // solhint-disable-next-line var-name-mixedcase
        uint256 min_amount
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function calc_withdraw_one_coin(
        // solhint-disable-next-line var-name-mixedcase
        uint256 token_amount,
        uint256 i
    ) external view returns (uint256);
}
