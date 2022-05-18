// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../CurveBase.sol";

import "../../../interfaces/curve/tricrypto/ICurveTricryptoLPGetter.sol";
import "../../../interfaces/curve/tricrypto/ICurveTricryptoLiquidityPool.sol";
import "../../../interfaces/curve/tricrypto/ICurveTricryptoLPGauge.sol";

/// @title CurveTricryptoBase contract used for any Curve Tricrypto strategy
/// @author Cosmin Grigore (@gcosmintech)
abstract contract CurveTricryptoBase is CurveBase {
    /// @notice curve lp gauge
    ICurveTricryptoLPGauge public lpGauge;
    /// @notice curve lp vault
    ICurveTricryptoLiquidityPool public lpVault;

    /// @notice custom contract for obtaining tokenIn
    ICurveTricryptoLPGetter public curveLPGetter;

    /// @notice sets the new address
    /// @param _newAddr the new address
    function setVault(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit VaultUpdated(address(lpVault), _newAddr);
        lpVault = ICurveTricryptoLiquidityPool(_newAddr);
    }

    /// @notice sets the new address
    /// @param _newAddr the new address
    function setLPGetter(address _newAddr)
        external
        onlyValidAddress(_newAddr)
        onlyOwner
    {
        emit CurveLpGetterUpdated(address(curveLPGetter), _newAddr);
        curveLPGetter = ICurveTricryptoLPGetter(_newAddr);
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
                "deposit(uint256,address,bool)",
                _amount,
                _recipient,
                false
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
            abi.encodeWithSignature("withdraw(uint256,bool)", _shares, false)
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
        ICurveTricryptoLPGetter _lpGetter
    ) internal returns (uint256) {
        uint256 result = 0;
        if (_token == _lpGetter.USDT()) {
            OperationsLib.safeApprove(_token, address(_lpGetter), _amount);
            result = _lpGetter.addLiquidityUsdt(_amount, _minAmount);
        } else if (_token == _lpGetter.WBTC()) {
            OperationsLib.safeApprove(_token, address(_lpGetter), _amount);
            result = _lpGetter.addLiquidityWbtc(_amount, _minAmount);
        } else if (_token == _lpGetter.WETH()) {
            OperationsLib.safeApprove(_token, address(_lpGetter), _amount);
            result = _lpGetter.addLiquidityWeth(_amount, _minAmount);
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
        ICurveTricryptoLPGetter _lpGetter
    ) internal returns (uint256) {
        uint256 result = 0;
        if (_token == _lpGetter.USDT()) {
            OperationsLib.safeApprove(_lpToken, address(_lpGetter), _lpAmount);
            result = _lpGetter.removeLiquidityUsdt(_lpAmount, _minAmount);
        } else if (_token == _lpGetter.WBTC()) {
            OperationsLib.safeApprove(_lpToken, address(_lpGetter), _lpAmount);
            result = _lpGetter.removeLiquidityWbtc(_lpAmount, _minAmount);
        } else if (_token == _lpGetter.WETH()) {
            OperationsLib.safeApprove(_lpToken, address(_lpGetter), _lpAmount);
            result = _lpGetter.removeLiquidityWeth(_lpAmount, _minAmount);
        } else {
            revert("3044");
        }
        require(result > 0, "3046");
        return result;
    }
}
