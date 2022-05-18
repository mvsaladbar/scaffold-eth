// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IManagerContainer {
    /// @notice emitted when the strategy manager is set
    event ManagerUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );

    /// @notice returns manager address
    function manager() external view returns (address);

    /// @notice Updates the manager address
    /// @param _address The address of the manager
    function updateManager(address _address) external;

}
