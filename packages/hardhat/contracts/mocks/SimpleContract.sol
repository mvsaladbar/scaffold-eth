// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/core/IHoldingManager.sol";

contract SimpleContract {
    function doesNothing() external pure returns (bool) {
        return true;
    }

    function shouldCreateHolding(address holdingManager)
        external
        returns (address)
    {
        return IHoldingManager(holdingManager).createHolding();
    }
}
