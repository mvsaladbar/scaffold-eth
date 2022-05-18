// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICurvePriceGetter {
    // solhint-disable-next-line func-name-mixedcase
    function get_virtual_price() external view returns (uint256);
}
