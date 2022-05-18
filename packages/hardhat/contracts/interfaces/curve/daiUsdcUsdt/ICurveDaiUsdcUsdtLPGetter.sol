// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ICurveDaiUsdcUsdtLiquidityPool.sol";

/// @title Interface for the cDai+cUsdc+cUsdt getter contract
/// @author Cosmin Grigore (@gcosmintech)
interface ICurveDaiUsdcUsdtLPGetter {
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
    function liquidityPool() external returns (ICurveDaiUsdcUsdtLiquidityPool);

    /// @notice returns lp token address
    function tokenOut() external view returns (address);

    /// @notice returns usdt address
    // solhint-disable-next-line func-name-mixedcase
    function USDT() external view returns (address);

    /// @notice returns usdc address
    // solhint-disable-next-line func-name-mixedcase
    function USDC() external view returns (address);

    /// @notice returns dai address
    // solhint-disable-next-line func-name-mixedcase
    function DAI() external view returns (address);

    /// @notice used to add USDT liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityUsdt(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to add USDC liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityUsdc(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to add DAI liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityDai(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to remove liquidity and get USDT
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityUsdt(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to remove liquidity and get USDC
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityUsdc(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);

    /// @notice used to remove liquidity and get DAI
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityDai(uint256 _amount, uint256 _minAmount)
        external
        returns (uint256);
}
