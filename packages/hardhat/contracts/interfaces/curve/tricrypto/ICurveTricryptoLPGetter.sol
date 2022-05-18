// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICurveTricryptoLiquidityPool.sol";

/// @title Interface for the tricrypto getter contract
/// @author Cosmin Grigore (@gcosmintech)
interface ICurveTricryptoLPGetter {
    /// @notice event emitted when liquidity was added
    event AddedLiquidity(
        address indexed token,
        uint256 amount,
        uint256 obtainedLP
    );
    /// @notice event emitted when liquidity was added
    event RemovedLiquidity(
        address indexed token,
        uint256 amountLP,
        uint256 obtainedAssets
    );

    /// @notice returns curve's liquidity pool
    function curveLiquidityPool()
        external
        returns (ICurveTricryptoLiquidityPool);

    /// @notice returns lp token address
    function tokenOut() external view returns (address);

    /// @notice returns usdt address
    // solhint-disable-next-line func-name-mixedcase
    function USDT() external view returns (address);

    /// @notice returns usdc address
    // solhint-disable-next-line func-name-mixedcase
    function WBTC() external view returns (address);

    /// @notice returns dai address
    // solhint-disable-next-line func-name-mixedcase
    function WETH() external view returns (address);

    /// @notice used to add USDT liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityUsdt(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to add WBTC liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityWbtc(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to add WETH liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityWeth(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to remove liquidity and get USDT
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityUsdt(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to remove liquidity and get WBTC
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityWbtc(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to remove liquidity and get WETH
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityWeth(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);
}
