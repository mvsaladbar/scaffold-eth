// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for Curve Minter
/// @author Cosmin Grigore (@gcosmintech)
interface ICurveMinter {
    // solhint-disable-next-line var-name-mixedcase
    function mint(address _gauge_addr) external;
}
