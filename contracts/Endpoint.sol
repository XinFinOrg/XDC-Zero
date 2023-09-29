// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerklePatricia} from "@polytope-labs/solidity-merkle-trees/src/MerklePatricia.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";
import {RLPReader} from "./libraries/RLPReader.sol";

/**
 * @title XDC Zero Endpoint
 * @author Galaxy
 * @notice Cross chain infra contract that receives packet and send packet to different chain
 */
contract Endpoint is Ownable {
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;
    using MerklePatricia for bytes32;

    struct Config {
        IFullCheckpoint checkpoint;
    }

    struct Log {
        address address_;
        bytes32[] topics;
        bytes data;
    }

    struct Receipt {
        bytes postStateOrStatus;
        uint64 cumulativeGasUsed;
        bytes bloom; // Assuming Bloom is a 32 bytes hash in Go
        Log[] logs; // Simplified version of []*LogForStorage
    }

    Config private _config;

    //sender endpoint => bool
    mapping(address => bool) private _se;

    // txHash => payload
    mapping(bytes => bytes) private _payloads;

    event Packet(bytes payload);

    event PacketReceived(bytes payload);

    function packetHash() private pure returns (bytes32) {
        return keccak256("Packet(bytes)");
    }

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

        for (uint256 i = 0; i < receipt.logs.length; i++) {
            if (
                receipt.logs[i].topics[0] == packetHash() &&
                _se[receipt.logs[i].address_]
            ) {
                bytes memory payload = receipt.logs[i].data;
                emit PacketReceived(payload);
                break;
            }
        }
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
        Log[] memory logs = new Log[](rlpLogs.length);
        for (uint256 i = 0; i < rlpLogs.length; i++) {
            RLPReader.RLPItem[] memory logItems = rlpLogs[i].toList();
            logs[i].address_ = logItems[0].toAddress();
            RLPReader.RLPItem[] memory topicsItems = logItems[1].toList();
            bytes32[] memory topics = new bytes32[](topicsItems.length);
            for (uint256 j = 0; j < topicsItems.length; j++) {
                topics[j] = bytes32(topicsItems[j].toUint());
            }
            logs[i].topics = topics;
            logs[i].data = logItems[2].toBytes();
        }
        receipt.logs = logs;
        return receipt;
    }
}
