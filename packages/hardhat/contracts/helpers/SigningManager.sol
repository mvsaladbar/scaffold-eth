// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./ClonerManager.sol";

//TODO: make use of this for our managers to avoid an extra approval
contract SigningManager is ClonerManager, Ownable {
    event Whitelisted(address indexed signingManager, bool approved);
    event Approved(
        address indexed signingManager,
        address indexed user,
        bool approved
    );
    event Registered(address indexed protocol);

    /// @notice contract -> user -> approval state
    mapping(address => mapping(address => bool)) public approvals;
    /// @notice list of whitelisted contracts for which users can allow or revoke access; only checked in case signature is not provided
    mapping(address => bool) public whitelisted;
    /// @notice user nonces for the approval operations
    mapping(address => uint256) public nonces;

    bytes32 private immutable _separator;
    uint256 private immutable _chainId;

    /// @notice Creates the SigningManager and assigns _chainId and _separator variables
    constructor() {
        uint256 chainId;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }
        _separator = _createDomainSeparatorForNewChain(_chainId = chainId);
    }

    /// @notice Returns the domain separate for the current chain id
    function getDomainSeparator() public view returns (bytes32) {
        uint256 chainId;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            chainId := chainid()
        }
        return
            chainId == _chainId
                ? _separator
                : _createDomainSeparatorForNewChain(chainId);
    }

    /// @notice Enables or disables a contract for approval without signed message
    /// @param _signingManager SingingManager's address
    /// @param _add If true, the SigningManager is added to the whitelist; otherwise it's removed
    function whitelistSigner(address _signingManager, bool _add)
        public
        validAddress(_signingManager)
        onlyOwner
    {
        whitelisted[_signingManager] = _add;
        emit Whitelisted(_signingManager, _add);
    }

    /// @notice Approves or revokes a `_contract` access to `_user` funds.
    /// @param _user The address of the user that approves or revokes access.
    /// @param _contract The address who gains or loses access.
    /// @param _approved If True approves access. If False revokes access.
    /// @param v recovery id
    /// @param r output of an ECDSA signature
    /// @param s output of an ECDSA signature
    function approveWithSignature(
        address _user,
        address _contract,
        bool _approved,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public validAddress(_contract) {
        if (r == 0 && s == 0 && v == 0) {
            require(_user == msg.sender, "1000");
            require(parents[_user] == address(0), "3501");
            require(whitelisted[_contract], "3033");
        } else {
            require(_user != address(0), "3031");

            bytes32 digest = keccak256(
                abi.encodePacked(
                    "\x19\x01",
                    getDomainSeparator(),
                    keccak256(
                        abi.encode(
                            keccak256(
                                "ApproveSigningManager(string message,address user,address signingManager,bool approved,uint256 nonce)"
                            ),
                            _approved
                                ? keccak256(
                                    "You allow AlcBox to access your funds?"
                                )
                                : keccak256("Revoke access for AlcBox?"),
                            _user,
                            _contract,
                            _approved,
                            nonces[_user]++
                        )
                    )
                )
            );
            address recoveredAddress = ecrecover(digest, v, r, s);
            require(recoveredAddress == _user, "3502");
        }

        approvals[_contract][_user] = _approved;
        emit Approved(_contract, _user, _approved);
    }

    function _createDomainSeparatorForNewChain(uint256 chainId)
        private
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    keccak256(
                        "EIP712Domain(string name,uint256 chainId,address verifyingContract)"
                    ),
                    keccak256("Pandora V1"),
                    chainId,
                    address(this)
                )
            );
    }
}
