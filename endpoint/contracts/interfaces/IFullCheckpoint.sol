// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

interface IFullCheckpoint {
    function getRoots(
        bytes32 blockHash
    )
        external
        view
        returns (
            bytes32 stateRoot,
            bytes32 transactionsRoot,
            bytes32 receiptRoot
        );
}
