// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

contract SimpleCsc {
    struct Root {
        bytes32 stateRoot;
        bytes32 transactionsRoot;
        bytes32 receiptRoot;
    }

    mapping(bytes32 => Root) private _roots;

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
        Root memory root = _roots[blockHash];
        stateRoot = root.stateRoot;
        transactionsRoot = root.transactionsRoot;
        receiptRoot = root.receiptRoot;
    }

    function setRoots(
        bytes32 blockHash,
        bytes32 stateRoot,
        bytes32 transactionsRoot,
        bytes32 receiptRoot
    ) external {
        _roots[blockHash] = Root({
            stateRoot: stateRoot,
            transactionsRoot: transactionsRoot,
            receiptRoot: receiptRoot
        });
    }
}
