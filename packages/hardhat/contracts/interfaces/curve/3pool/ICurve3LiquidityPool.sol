// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for the Curve Tricrypto Liquidity Pool
/// @author Cosmin Grigore (@gcosmintech)
interface ICurve3LiquidityPool {
    function coins(int128 i) external view returns (address);

    // solhint-disable-next-line func-name-mixedcase
    function underlying_coins(int128 i) external view returns (address);

    function curve() external view returns (address);

    // solhint-disable-next-line func-name-mixedcase
    function add_liquidity(
        uint256[3] calldata uamounts,
        // solhint-disable-next-line var-name-mixedcase
        uint256 min_mint_amount
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function remove_liquidity(
        uint256 _amount,
        // solhint-disable-next-line var-name-mixedcase
        uint256 min_uamounts
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function remove_liquidity_one_coin(
        // solhint-disable-next-line var-name-mixedcase
        uint256 _token_amount,
        int128 i,
        // solhint-disable-next-line var-name-mixedcase
        uint256 min_uamount
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function calc_withdraw_one_coin(
        // solhint-disable-next-line var-name-mixedcase
        uint256 _token_amount,
        int128 i,
        uint256[3] calldata rates
    ) external view returns (uint256);
}
