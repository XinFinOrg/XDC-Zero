// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerklePatricia} from "@polytope-labs/solidity-merkle-trees/src/MerklePatricia.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";
import {RLPReader} from "./libraries/RLPReader.sol";

contract Endpoint is Ownable {
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;
    using MerklePatricia for bytes32;

    struct Config {
        IFullCheckpoint checkpoint;
    }

    struct Receipt {
        bytes postStateOrStatus;
        uint64 cumulativeGasUsed;
        bytes bloom; // Assuming Bloom is a 32 bytes hash in Go
        bytes[] logs; // Simplified version of []*LogForStorage
    }

    Config private _config;

    // txHash => payload
    mapping(bytes => bytes) private _payloads;

    event Packet(bytes payload);

    event PacketReceived(bytes payload);

    function send(bytes calldata payload) external {
        emit Packet(payload);
    }

    function getPayload(
        bytes calldata txHash
    ) external view returns (bytes memory) {
        return _payloads[txHash];
    }

    function validateTransactionProof(
        bytes memory key,
        bytes[] calldata proof,
        bytes32 blockHash
    ) external {
        IFullCheckpoint checkpoint = getConfig().checkpoint;
        bytes32 receiptRoot = checkpoint.getReceiptHash(blockHash);

        bytes[] memory keys = new bytes[](1);
        keys[0] = key;
        bytes memory receiptRlp = receiptRoot
        .VerifyEthereumProof(proof, keys)[0].value;

        require(receiptRlp.length > 0, "invalid proof");

        Receipt memory receipt = getReceipt(receiptRlp);
        // TODO
        bytes memory payload = receipt.logs[0];
       
        emit PacketReceived(payload);
    }

    function getConfig() public view returns (Config memory) {
        require(
            _config.checkpoint != IFullCheckpoint(address(0)),
            "no checkpoint"
        );
        return _config;
    }

    function setConfig(Config calldata config) external onlyOwner {
        require(
            config.checkpoint != IFullCheckpoint(address(0)),
            "invalid checkpoint"
        );
        _config = config;
    }

    //TODO
    function getReceipt(
        bytes memory receiptRlp
    ) public pure returns (Receipt memory) {
        RLPReader.RLPItem[] memory items = receiptRlp.toRlpItem().toList();

        Receipt memory receipt;
        receipt.postStateOrStatus = items[0].toBytes();
        receipt.cumulativeGasUsed = uint64(items[1].toUint());
        receipt.bloom = items[2].toBytes();
        // Decode logs
        RLPReader.RLPItem[] memory rlpLogs = items[3].toList();
        receipt.logs = new bytes[](rlpLogs.length);
        for (uint256 i = 0; i < rlpLogs.length; i++) {
            receipt.logs[i] = rlpLogs[i].toBytes();
        }
        return receipt;
    }
}
