// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";
import {RLPEncode} from "./libraries/RLPEncode.sol";

contract Endpoint is Ownable {
    struct Config {
        IFullCheckpoint checkpoint;
    }

    struct TransactionProof {
        bytes32 blockhash;
        bytes32[] proof;
        //receipt
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

    mapping(bytes => bytes) private _payloads;

    function send() external {}

    function receivePayload() external returns (bytes memory) {}

    function validateTransactionProof(
        TransactionProof calldata txProof
    ) external {
        IFullCheckpoint checkpoint = getConfig().checkpoint;
        bytes32 root = checkpoint.getReceiptHash(txProof.blockhash);
        bytes32 leaf = getLeaf(txProof);
        require(MerkleProof.verify(txProof.proof, root, leaf), "invalid proof");
        // TODO
        bytes memory payload = txProof.logs[0];
        _payloads[txProof.txHash] = payload;
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

    function getLeaf(
        TransactionProof memory txProof
    ) public pure returns (bytes32) {
        bytes[] memory encodedParts = new bytes[](8);

        encodedParts[0] = RLPEncode.encodeBytes(txProof.postState);
        encodedParts[1] = RLPEncode.encodeUint(txProof.status);
        encodedParts[2] = RLPEncode.encodeUint(txProof.cumulativeGasUsed);
        encodedParts[3] = RLPEncode.encodeBytes(txProof.bloom);
        encodedParts[4] = RLPEncode.encodeList(txProof.logs);
        encodedParts[5] = RLPEncode.encodeBytes(txProof.txHash);
        encodedParts[6] = RLPEncode.encodeAddress(txProof.contractAddress);
        encodedParts[7] = RLPEncode.encodeUint(txProof.gasUsed);

        return bytesToBytes32(RLPEncode.encodeList(encodedParts));
    }

    function bytesToBytes32(bytes memory input) public pure returns (bytes32) {
        require(input.length <= 32, "Input too long");

        bytes32 output;
        assembly {
            output := mload(add(input, 32))
        }
        return output;
    }
}
