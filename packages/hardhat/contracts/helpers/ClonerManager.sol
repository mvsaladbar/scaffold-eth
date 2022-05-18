// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "../interfaces/helpers/IClonerManager.sol";
import "../interfaces/stablecoin/IInitiator.sol";

// Creates clone, more info here: https://blog.openzeppelin.com/deep-dive-into-the-minimal-proxy-contract/
/// @title Creates clones using CREATE or CREATE2 opcodes
contract ClonerManager is IClonerManager {
    /// @notice Mapping from clone contracts to their signingManager.
    mapping(address => address) public parents;

    /// @notice Clones a SigningManager contract using CREATE opcode and forwards the sent ETH to the new clone
    /// @param _signingManager Address of the SigningManager contract
    /// @param _data Additional abi encoded calldata that is passed to the new clone via `ISigningManager.init`.
    /// @return result Clone address
    function cloneV1(address _signingManager, bytes calldata _data)
        public
        payable
        override
        validAddress(_signingManager)
        returns (address result)
    {
        result = _cloneWithV1(_signingManager);
        require(result != address(0), "3500");

        parents[result] = _signingManager;

        IInitiator(result).init{value: msg.value}(_data);
        emit Cloned(_signingManager, _data, result);
    }

    /// @notice Clones a SigningManager contract using CREATE2 opcode and forwards the sent ETH to the new clone
    /// @param _signingManager Address of the SigningManager contract
    /// @param _data Additional abi encoded calldata that is passed to the new clone via `ISigningManager.init`.
    /// @return result Clone address
    function cloneV2(address _signingManager, bytes calldata _data)
        public
        payable
        override
        validAddress(_signingManager)
        returns (address result)
    {
        result = _cloneWithV2(_signingManager, keccak256(_data));
        require(result != address(0), "3500");

        parents[result] = _signingManager;

        IInitiator(result).init{value: msg.value}(_data);
        emit Cloned(_signingManager, _data, result);
    }

    function _cloneWithV1(address _signingManager)
        private
        returns (address result)
    {
        bytes20 targetBytes = bytes20(_signingManager);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let clonePlaceholder := mload(0x40)
            mstore(
                clonePlaceholder,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(clonePlaceholder, 0x14), targetBytes)
            mstore(
                add(clonePlaceholder, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            result := create(0, clonePlaceholder, 0x37)
        }
    }

    function _cloneWithV2(address _signingManager, bytes32 _salt)
        private
        returns (address result)
    {
        bytes20 targetBytes = bytes20(_signingManager);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let clonePlaceholder := mload(0x40)
            mstore(
                clonePlaceholder,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(clonePlaceholder, 0x14), targetBytes)
            mstore(
                add(clonePlaceholder, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            result := create2(0, clonePlaceholder, 0x37, _salt)
        }
    }

    modifier validAddress(address _val) {
        require(_val != address(0), "3000");
        _;
    }
}
