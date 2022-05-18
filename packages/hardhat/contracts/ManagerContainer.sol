// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/core/IManagerContainer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ManagerContainer is IManagerContainer, Ownable {
    /// @notice returns manager address
    address public override manager;

    constructor(address _manager) {
        manager = _manager;
    }

    /// @notice Updates the manager address
    /// @param _newManager The address of the manager
    function updateManager(address _newManager)
        external
        override
        onlyOwner
    {
        require(_newManager != address(0), "3003");
        require(_newManager != manager, "3062");
        emit ManagerUpdated(manager, _newManager);
        manager = _newManager;
    }
}
