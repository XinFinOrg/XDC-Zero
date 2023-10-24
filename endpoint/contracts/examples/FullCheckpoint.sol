// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

contract FullCheckpoint {
    struct Root {
        bytes32 stateRoot;
        bytes32 transactionsRoot;
        bytes32 receiptRoot;
    }

    mapping(bytes32 => Root) public roots;

    function getRoots(
        bytes32 blockHash
    )
        external
        view
        returns (
            bytes32 stateRoot,
            bytes32 transactionsRoot,
            bytes32 receiptRoot
        )
    {
        return (
            roots[blockHash].stateRoot,
            roots[blockHash].transactionsRoot,
            roots[blockHash].receiptRoot
        );
    }

    function addRoot(
        bytes32 blockHash,
        bytes32 stateRoot,
        bytes32 transactionsRoot,
        bytes32 receiptRoot
    ) public {
        roots[blockHash] = Root(stateRoot, transactionsRoot, receiptRoot);
    }
}
