// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.19;

interface IFullCheckpoint {
    function getReceiptHash(bytes32 blockHash) external view returns (bytes32);
}
