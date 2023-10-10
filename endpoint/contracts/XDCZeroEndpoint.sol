// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerklePatricia} from "@polytope-labs/solidity-merkle-trees/src/MerklePatricia.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";
import {RLPReader} from "./libraries/RLPReader.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title XDC Zero Endpoint
 * @author Galaxy
 * @notice Cross chain infra contract that receives packet and send packet to different chain
 */
contract XDCZeroEndpoint is Ownable, ReentrancyGuard {
    using Address for address;
    using RLPReader for bytes;
    using RLPReader for RLPReader.RLPItem;
    using MerklePatricia for bytes32;

    /**
     * @dev csc is the checkpoint contract of the receive chain
     * @dev endpoint is the address of the endpoint contract of the send chain
     */
    struct Chain {
        IFullCheckpoint csc;
        XDCZeroEndpoint endpoint;
    }

    /**
     * @dev log of the receipt
     */
    struct Log {
        address address_;
        bytes32[] topics;
        bytes data;
    }
    /**
     * @dev receipt of the transuaction
     */
    struct Receipt {
        bytes postStateOrStatus;
        uint64 cumulativeGasUsed;
        bytes bloom;
        Log[] logs;
    }

    //chainId=>Chain
    mapping(uint256 => Chain) private _chains;

    //chainIds
    uint256[] private _chainKeys;

    /**
     * @dev chainId of the current chain
     */
    uint256 private _chainId;

    /**
     *
     * @param payload payload of the packet
     * chainId of the send chain
     * sua is send applicaiton
     * rua is receive applicaiton
     * data is the data of the packet
     */
    event Packet(bytes payload);

    event PacketReceived(
        uint256 sid,
        address sua,
        uint256 rid,
        address rua,
        bytes data
    );

    /**
     *
     * @param chainId chainId of the send chain
     * @param csc checkpoint contract of the receive chain
     * @param endpoint endpoint contract of the send chain
     */
    event ChainRegistered(
        uint256 chainId,
        IFullCheckpoint csc,
        XDCZeroEndpoint endpoint
    );

    /**
     * @dev initialize the contract
     * @param chainId chainId of the current chain
     */
    function initialize(uint256 chainId) external {
        _chainId = chainId;
    }

    /**
     * @dev get hash of the packet event
     */
    function packetHash() private pure returns (bytes32) {
        return keccak256("Packet(bytes)");
    }

    /**
     * @dev send packet to the receive chain
     * @param rid receive chainId
     * @param rua receive application address
     * @param data data of the packet , it will be used to call rua contract
     */
    function send(
        uint256 rid,
        address rua,
        bytes calldata data
    ) external payable {
        require(_chainId != 0, "chainId not set");
        address sua = msg.sender;
        uint256 sid = _chainId;
        bytes memory payload = abi.encode(sid, sua, rid, rua, data);
        emit Packet(payload);
    }

    /**
     * @dev validate transuaction proof and suave payload
     * @param cid chainId of the send chain
     * @param key key of the receipt mekle tree
     * @param proof proof of the key of receipt mekle tree
     * @param blockHash blockHash of the receipt
     */
    function validateTransuactionProof(
        uint256 cid,
        bytes memory key,
        bytes[] calldata proof,
        bytes32 blockHash
    ) external nonReentrant {
        require(_chainId != 0, "current chainId not set");
        Chain memory chain = _chains[cid];
        IFullCheckpoint csc = chain.csc;
        require(csc != IFullCheckpoint(address(0)), "chainId not registered");

        bytes32 receiptRoot = csc.getReceiptHash(blockHash);

        bytes[] memory keys = new bytes[](1);
        keys[0] = key;
        bytes memory receiptRlp = receiptRoot
        .VerifyEthereumProof(proof, keys)[0].value;

        require(receiptRlp.length > 0, "invalid proof");

        Receipt memory receipt = getReceipt(receiptRlp);

        //there need verify the receipt contract address , the address must be equals the sender chain endpoint address
        //TODO receipt.contractAddress==address(chain.endpoint)

        for (uint256 i = 0; i < receipt.logs.length; i++) {
            if (
                receipt.logs[i].topics[0] == packetHash() &&
                receipt.logs[i].address_ == address(chain.endpoint)
            ) {
                bytes memory payload = receipt.logs[i].data;
                // receive send packet data
                (
                    uint256 sid,
                    address sua,
                    uint256 rid,
                    address rua,
                    bytes memory data
                ) = abi.decode(
                        payload,
                        (uint256, address, uint256, address, bytes)
                    );

                require(sid == cid, "invalid packet send chainId");
                require(rid == _chainId, "invalid packet receive chainId");

                // because call audited rua contract ,so dont need value and gas limit
                rua.functionCall(data);

                emit PacketReceived(sid, sua, rid, rua, data);
                break;
            }
        }
    }

    /**
     * @dev register a chain
     * @param chainId chainId of the send chain
     * @param csc checkpoint contract of the receive chain
     * @param endpoint endpoint contract of the send chain
     */
    function registerChain(
        uint256 chainId,
        IFullCheckpoint csc,
        XDCZeroEndpoint endpoint
    ) external onlyOwner {
        for (uint256 i = 0; i < _chainKeys.length; i++) {
            require(_chainKeys[i] != chainId, "chainId already registered");
        }

        _chains[chainId] = Chain(csc, endpoint);
        _chainKeys.push(chainId);
        emit ChainRegistered(chainId, csc, endpoint);
    }

    /**
     * @dev get receipt from rlp
     * @param receiptRlp receipt rlp
     */
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

    /**
     * @dev get chainId of the current chain
     */
    function getChainId() external view returns (uint256) {
        return _chainId;
    }

    /**
     * @dev get chainId of the send chain
     * @param chainId chainId of the send chain
     */
    function getChain(
        uint256 chainId
    ) external view returns (Chain memory chain) {
        chain = _chains[chainId];
    }

    /**
     * @dev edit chain
     * @param chainId chainId of the send chain
     * @param csc checkpoint contract of the receive chain
     * @param endpoint endpoint contract of the send chain
     */
    function editChain(
        uint256 chainId,
        IFullCheckpoint csc,
        XDCZeroEndpoint endpoint
    ) external onlyOwner {
        _chains[chainId] = Chain(csc, endpoint);
    }

    /**
     * @dev get chainIds
     */
    function getChainKeys() external view returns (uint256[] memory) {
        return _chainKeys;
    }
}
