// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Interface for a strategy
/// @author Cosmin Grigore (@gcosmintech)
interface IMerkleDistributor {
    /// @notice event emitted when tokens are claimed
    event Claimed(uint256 index, address account, uint256 amount);

    /// @notice returns claimable token address
    function token() external view returns (address);

    /// @notice returns the merkle root
    function merkleRoot() external view returns (bytes32);

    /// @notice checks if index was claimed
    function isClaimed(uint256 index) external view returns (bool);

    /// @notice claims tokens for sender
    /// @param index the index for which the claim is done
    /// @param amount the amount to claim
    /// @param merkleProof merkle tree proof
    function claim(
        uint256 index,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external;
}
