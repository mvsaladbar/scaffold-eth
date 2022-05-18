// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IClonerManager {
    event Cloned(
        address indexed signingManager,
        bytes data,
        address indexed cloneAddress
    );

    function cloneV1(address _signer, bytes calldata _data)
        external
        payable
        returns (address);

    function cloneV2(address _signer, bytes calldata _data)
        external
        payable
        returns (address);
}
