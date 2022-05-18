// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../CurveBase.sol";

import "../../../interfaces/curve/3pool/ICurve3PoolLPGetter.sol";
import "../../../interfaces/curve/3pool/ICurve3PoolGauge.sol";
import "../../../interfaces/curve/3pool/ICurve3LiquidityPool.sol";

/// @title Curve3PoolBase contract used for any Curve 3Pool strategy
/// @author Cosmin Grigore (@gcosmintech)
abstract contract Curve3PoolBase is CurveBase {
    /// @notice curve lp gauge
    ICurve3PoolGauge public lpGauge;
    /// @notice curve lp vault
    ICurve3LiquidityPool public lpVault;
    /// @notice custom contract for obtaining tokenIn
    ICurve3PoolLPGetter public curveLPGetter;

    /// @notice sets the new address
    /// @param _newAddr the new address
    function setVault(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit VaultUpdated(address(lpVault), _newAddr);
        lpVault = ICurve3LiquidityPool(_newAddr);
    }

    /// @notice sets the new address
    /// @param _newAddr the new address
    function setLPGetter(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit CurveLpGetterUpdated(address(curveLPGetter), _newAddr);
        curveLPGetter = ICurve3PoolLPGetter(_newAddr);
    }

    /// @notice deposits into the gauge
    /// @param _tokenIn token's address
    /// @param _amount amount to be invested
    /// @param _recipient holding address
    function _deposit(
        address _tokenIn,
        uint256 _amount,
        address _recipient
    ) internal returns (uint256) {
        uint256 sharesBefore = lpGauge.balanceOf(_recipient);

        IHolding(_recipient).approve(_tokenIn, address(lpGauge), _amount);
        IHolding(_recipient).genericCall(
            address(lpGauge),
            abi.encodeWithSignature(
                "deposit(uint256,address)",
                _amount,
                _recipient
            )
        );

        uint256 sharesAfter = lpGauge.balanceOf(_recipient);
        require(sharesAfter > sharesBefore, "3028");
        return sharesAfter - sharesBefore;
    }

    /// @notice withdraws investments
    /// @param _asset token to be extracted address
    /// @param _shares burn amount
    /// @param _recipient holding address
    function _withdraw(
        address _asset,
        uint256 _shares,
        address _recipient
    ) internal returns (uint256) {
        uint256 assetsBefore = IERC20(_asset).balanceOf(_recipient);

        IHolding(_recipient).genericCall(
            address(lpGauge),
            abi.encodeWithSignature("withdraw(uint256)", _shares)
        );

        uint256 assetsAfter = IERC20(_asset).balanceOf(_recipient);
        require(assetsAfter > assetsBefore, "2006");

        IHolding(_recipient).transfer(
            _asset,
            address(this),
            assetsAfter - assetsBefore
        );

        return assetsAfter - assetsBefore;
    }

    function _claimRewards(address _rewardToken, address _recipient)
        internal
        returns (uint256)
    {
        uint256 balanceBefore = IERC20(_rewardToken).balanceOf(_recipient);
        (bool success, ) = IHolding(_recipient).genericCall(
            address(curveMinter),
            abi.encodeWithSignature("mint(address)", address(lpGauge))
        );
        require(success, "3037");
        uint256 balanceAfter = IERC20(_rewardToken).balanceOf(_recipient);

        uint256 result = balanceAfter - balanceBefore;
        (uint256 performanceFee,, ) = _getStrategyManager().strategyInfo(
            address(this)
        );

        uint256 fee = OperationsLib.getFeeAbsolute(result, performanceFee);
        if (fee > 0) {
            IHolding(_recipient).transfer(
                _rewardToken,
                _getManager().feeAddress(),
                fee
            );

            emit FeeTaken(_rewardToken, _getManager().feeAddress(), fee);
            result -= fee;
        }

        return result;
    }

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
        ICurve3PoolLPGetter _lpGetter
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
        ICurve3PoolLPGetter _lpGetter
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
