// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../interfaces/curve/3pool/ICurve3LiquidityPool.sol";
import "../../../interfaces/curve/3pool/ICurve3PoolLPGetter.sol";

import "../../../libraries/OperationsLib.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Curve 3Crv getter contract
/// @author Cosmin Grigore (@gcosmintech)
contract Curve3PoolLPGetter is Ownable, ReentrancyGuard, ICurve3PoolLPGetter {
    using SafeERC20 for IERC20;

    /// @notice returns curve's liquidity pool
    ICurve3LiquidityPool public override curveLiquidityPool;

    address public constant override USDT =
        0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant override USDC =
        0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant override DAI =
        0x6B175474E89094C44Da98b954EedeAC495271d0F;

    /// @notice returns the lp token address
    address public immutable override tokenOut;

    constructor(address _curveLiquidityPool, address _token) {
        require(_curveLiquidityPool != address(0), "3000");
        require(_token != address(0), "3001");
        curveLiquidityPool = ICurve3LiquidityPool(_curveLiquidityPool);
        tokenOut = _token;
    }

    /// @notice used to add USDT liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityUsdt(uint256 _amount, uint256 _minAmount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        uint256[3] memory liquidityArr;
        liquidityArr[0] = 0;
        liquidityArr[1] = 0;
        liquidityArr[2] = _amount;
        return _addLiquidity(USDT, _amount, liquidityArr, _minAmount);
    }

    /// @notice used to add USDC liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityUsdc(uint256 _amount, uint256 _minAmount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        uint256[3] memory liquidityArr;
        liquidityArr[0] = 0;
        liquidityArr[1] = _amount;
        liquidityArr[2] = 0;
        return _addLiquidity(USDC, _amount, liquidityArr, _minAmount);
    }

    /// @notice used to add DAI liquidity
    /// @param _amount the amount of token to be used in the add liquidity operation
    /// @param _minAmount the min amount of LP token to be received
    function addLiquidityDai(uint256 _amount, uint256 _minAmount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        uint256[3] memory liquidityArr;
        liquidityArr[0] = _amount;
        liquidityArr[1] = 0;
        liquidityArr[2] = 0;
        return _addLiquidity(DAI, _amount, liquidityArr, _minAmount);
    }

    /// @notice used to remove liquidity and get USDT
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityUsdt(uint256 _amount, uint256 _minAmount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        return _removeLiquidity(USDT, _amount, 2, _minAmount);
    }

    /// @notice used to remove liquidity and get USDC
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityUsdc(uint256 _amount, uint256 _minAmount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        return _removeLiquidity(USDC, _amount, 1, _minAmount);
    }

    /// @notice used to remove liquidity and get DAI
    /// @param _amount the amount of LP token to be used in the remove liquidity operation
    /// @param _minAmount the min amount of token to be received
    function removeLiquidityDai(uint256 _amount, uint256 _minAmount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        return _removeLiquidity(DAI, _amount, 0, _minAmount);
    }

    function _removeLiquidity(
        address _token,
        uint256 _amount,
        int128 _index,
        uint256 _min
    ) private returns (uint256) {
        require(_amount > 0, "2001");
        require(_index < 3, "3047");

        IERC20(tokenOut).safeTransferFrom(msg.sender, address(this), _amount);
        OperationsLib.safeApprove(
            tokenOut,
            address(curveLiquidityPool),
            _amount
        );

        uint256 assetBalanceBefore = IERC20(_token).balanceOf(address(this));
        curveLiquidityPool.remove_liquidity_one_coin(_amount, _index, _min);
        uint256 assetBalanceAfter = IERC20(_token).balanceOf(address(this));
        require(assetBalanceAfter > assetBalanceBefore, "3037");
        IERC20(_token).safeTransfer(
            msg.sender,
            assetBalanceAfter - assetBalanceBefore
        );

        emit RemovedLiquidity(
            _token,
            _amount,
            assetBalanceAfter - assetBalanceBefore
        );
        return assetBalanceAfter - assetBalanceBefore;
    }

    function _addLiquidity(
        address _token,
        uint256 _amount,
        uint256[3] memory arr,
        uint256 _min
    ) private returns (uint256) {
        require(_amount > 0, "2001");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        OperationsLib.safeApprove(_token, address(curveLiquidityPool), _amount);

        uint256 lpBalanceBefore = IERC20(tokenOut).balanceOf(address(this));
        curveLiquidityPool.add_liquidity(arr, _min);
        uint256 lpBalanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require(lpBalanceAfter > lpBalanceBefore, "3037");
        IERC20(tokenOut).safeTransfer(
            msg.sender,
            lpBalanceAfter - lpBalanceBefore
        );
        emit AddedLiquidity(_token, _amount, lpBalanceAfter - lpBalanceBefore);
        return lpBalanceAfter - lpBalanceBefore;
    }
}
