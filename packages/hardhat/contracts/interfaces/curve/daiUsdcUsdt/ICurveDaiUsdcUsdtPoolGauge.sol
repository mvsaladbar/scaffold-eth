// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for Curve cDai+cUsdc+cUsdt staking gauge
/// @author Cosmin Grigore (@gcosmintech)
interface ICurveDaiUsdcUsdtPoolGauge {
    // solhint-disable-next-line func-name-mixedcase
    function crv_token() external view returns (address);

    function deposit(uint256 _value, address _addr) external;

    function withdraw(uint256 value) external;

    function balanceOf(address _addr) external view returns (uint256);

    // solhint-disable-next-line func-name-mixedcase
    function claimable_tokens(address _addr) external returns (uint256);
}
