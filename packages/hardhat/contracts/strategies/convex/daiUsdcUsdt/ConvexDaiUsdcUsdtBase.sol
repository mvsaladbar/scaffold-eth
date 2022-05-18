// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../interfaces/curve/daiUsdcUsdt/ICurveDaiUsdcUsdtLPGetter.sol";

import "../ConvexBase.sol";

/// @title ConvexDaiUsdcUsdtBase contract used for any Convex cDai+cUsdc+cUsdt strategy
/// @author Cosmin Grigore (@gcosmintech)
abstract contract ConvexDaiUsdcUsdtBase is ConvexBase {
    /// @notice wraps underlying into LP
    /// @param _token underlying token
    /// @param _amount amount to be wrapped
    /// @param _minAmount min amount of LP to be received
    /// @param _lpGetter lp getter contract's address
    /// @return obtained LPs
    function _wrap(
        address _token,
        uint256 _amount,
        uint256 _minAmount,
        ICurveDaiUsdcUsdtLPGetter _lpGetter
    ) internal returns (uint256) {
        uint256 result = 0;
        if (_token == _lpGetter.USDT()) {
            OperationsLib.safeApprove(_token, address(_lpGetter), _amount);
            result = _lpGetter.addLiquidityUsdt(_amount, _minAmount);
        } else if (_token == _lpGetter.USDC()) {
            OperationsLib.safeApprove(_token, address(_lpGetter), _amount);
            result = _lpGetter.addLiquidityUsdc(_amount, _minAmount);
        } else if (_token == _lpGetter.DAI()) {
            OperationsLib.safeApprove(_token, address(_lpGetter), _amount);
            result = _lpGetter.addLiquidityDai(_amount, _minAmount);
        } else {
            revert("3044");
        }
        require(result > 0, "3045");
        return result;
    }

    /// @notice unwraps underlying into LP
    /// @param _token underlying token
    /// @param _lpToken lp token address
    /// @param _lpAmount lp amount to unwrap
    /// @param _minAmount min amount of asset to be received
    /// @param _lpGetter lp getter contract's address
    /// @return obtained assets
    function _unwrap(
        address _token,
        address _lpToken,
        uint256 _lpAmount,
        uint256 _minAmount,
        ICurveDaiUsdcUsdtLPGetter _lpGetter
    ) internal returns (uint256) {
        uint256 result = 0;
        if (_token == _lpGetter.USDT()) {
            OperationsLib.safeApprove(_lpToken, address(_lpGetter), _lpAmount);
            result = _lpGetter.removeLiquidityUsdt(_lpAmount, _minAmount);
        } else if (_token == _lpGetter.USDC()) {
            OperationsLib.safeApprove(_lpToken, address(_lpGetter), _lpAmount);
            result = _lpGetter.removeLiquidityUsdc(_lpAmount, _minAmount);
        } else if (_token == _lpGetter.DAI()) {
            OperationsLib.safeApprove(_lpToken, address(_lpGetter), _lpAmount);
            result = _lpGetter.removeLiquidityDai(_lpAmount, _minAmount);
        } else {
            revert("3044");
        }
        require(result > 0, "3046");
        return result;
    }
}
