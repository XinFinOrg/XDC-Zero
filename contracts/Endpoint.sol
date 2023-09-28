// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerklePatricia} from "@polytope-labs/solidity-merkle-trees/src/MerklePatricia.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";
import {RLPEncode} from "./libraries/RLPEncode.sol";

contract Endpoint is Ownable {
    struct Config {
        IFullCheckpoint checkpoint;
    }

    struct Receipt {
        bytes postState;
        uint256 status;
        uint256 cumulativeGasUsed;
        bytes bloom;
        bytes[] logs;
        bytes txHash;
        address contractAddress;
        uint256 gasUsed;
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
        bytes[] memory keys,
        bytes[] calldata proof,
        bytes32 blockHash
    ) external {
        require(keys.length == 1, "invalid keys length");
        IFullCheckpoint checkpoint = getConfig().checkpoint;
        bytes32 receiptRoot = checkpoint.getReceiptHash(blockHash);

        bytes memory receiptRlp = MerklePatricia
        .VerifyEthereumProof(receiptRoot, proof, keys)[0].value;

        require(receiptRlp.length > 0, "invalid proof");

        Receipt memory receipt = getReceipt(receiptRlp);
        // TODO
        bytes memory payload = receipt.logs[0];
        _payloads[receipt.txHash] = payload;
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
        return
            Receipt({
                postState: new bytes(1),
                status: 1,
                cumulativeGasUsed: 0,
                bloom: new bytes(256),
                logs: new bytes[](1),
                txHash: new bytes(32),
                contractAddress: address(0),
                gasUsed: 0
            });
    }
}
