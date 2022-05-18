// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/core/IMerkleDistributor.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title PandoraMerkle contract
/// @author Cosmin Grigore (@gcosmintech)
contract PandoraMerkle is Ownable, ReentrancyGuard, IMerkleDistributor {
    using SafeERC20 for IERC20;

    /// @notice returns PandoraToken address
    address public immutable override token;
    /// @notice returns the merkle root
    bytes32 public immutable override merkleRoot;

    mapping(uint256 => uint256) private _claimedMap;

    /// @notice creates a new merkle distributor
    constructor(address _token, bytes32 _merkleRoot) {
        require(_merkleRoot.length > 0, "2001");
        require(_token != address(0), "3000");
        token = _token;
        merkleRoot = _merkleRoot;
    }

    /// @notice checks if index was claimed
    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = _claimedMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    /// @notice claims tokens for sender
    /// @param index the index for which the claim is done
    /// @param amount the amount to claim
    /// @param merkleProof merkle tree proof
    function claim(
        uint256 index,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external override nonReentrant {
        require(!isClaimed(index), "3050");

        bytes32 node = keccak256(abi.encodePacked(index, msg.sender, amount));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "3051");

        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        _claimedMap[claimedWordIndex] =
            _claimedMap[claimedWordIndex] |
            (1 << claimedBitIndex);

        IERC20(token).safeTransfer(msg.sender, amount);

        emit Claimed(index, msg.sender, amount);
    }
}
