// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../core/IManagerContainer.sol";

interface IPandoraUSD {
    /// @notice event emitted when the mint limit is updated
    event MintLimitUpdated(uint256 oldLimit, uint256 newLimit);

    /// @notice sets the manager address
    /// @param _limit the new mint limit
    function updateMintLimit(uint256 _limit) external;

    /// @notice interface of the manager container contract
    function managerContainer() external view returns (IManagerContainer);

    /// @notice returns the max mint limitF
    function mintLimit() external view returns (uint256);

    /// @notice returns total minted so far
    function totalMinted() external view returns (uint256);

    /// @notice mint tokens
    /// @dev no need to check if '_to' is a valid address if the '_mint' method is used
    /// @param _to address of the user receiving minted tokens
    /// @param _amount the amount to be minted
    /// @param _decimals amount's decimals
    function mint(
        address _to,
        uint256 _amount,
        uint8 _decimals
    ) external;

    /// @notice burns token from sender
    /// @param _amount the amount of tokens to be burnt
    /// @param _decimals amount's decimals
    function burn(uint256 _amount, uint8 _decimals) external;

    /// @notice burns token from an address
    /// @param _user the user to burn it from
    /// @param _amount the amount of tokens to be burnt
    /// @param _decimals amount's decimals
    function burnFrom(
        address _user,
        uint256 _amount,
        uint8 _decimals
    ) external;
}
