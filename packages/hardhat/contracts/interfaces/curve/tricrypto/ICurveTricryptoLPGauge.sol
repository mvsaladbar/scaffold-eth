// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for Curve Tricrypto LP staking gauge
/// @author Cosmin Grigore (@gcosmintech)
interface ICurveTricryptoLPGauge {
    // solhint-disable-next-line func-name-mixedcase
    function crv_token() external view returns (address);

    function deposit(
        uint256 _value,
        address _addr,
        // solhint-disable-next-line var-name-mixedcase
        bool _claim_rewards
    ) external;

    function withdraw(
        uint256 value,
        // solhint-disable-next-line var-name-mixedcase
        bool _claim_rewards
    ) external;

    // solhint-disable-next-line func-name-mixedcase
    function claim_rewards(address _addr, address _receiver) external;

    // solhint-disable-next-line func-name-mixedcase
    function claimable_tokens(address _addr) external returns (uint256);

    function balanceOf(address _addr) external view returns (uint256);
}
