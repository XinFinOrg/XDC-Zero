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
contract Endpoint is Ownable, ReentrancyGuard {
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
        Endpoint endpoint;
        uint256 lastIndex;
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

    struct Transaction {
        address to;
    }

    //chainId=>Chain
    mapping(uint256 => Chain) private _chains;

    mapping(address => bool) private _approvedRua;

    mapping(address => bool) private _approvedSua;

    //chainId=>lastIndex
    mapping(uint256 => uint256) private _chainlastIndexes;

    //chainIds
    uint256[] private _chainIds;

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
        uint256 index,
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
        Endpoint endpoint
    );

    /**
     * @dev get hash of the packet event
     */
    function packetHash() public pure returns (bytes32) {
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
        address sua = msg.sender;
        if (!msg.sender.isContract()) {
            sua = address(this);
        }

        uint256 sid = getChainId();

        _chainlastIndexes[rid]++;
        bytes memory payload = abi.encode(
            _chainlastIndexes[rid],
            sid,
            sua,
            rid,
            rua,
            data
        );

        emit Packet(payload);
    }

    /**
     * @dev get rlp from proof
     * @param key key of the rlp
     * @param proof proof of the rlp
     * @param root root of the rlp
     */
    function getRlp(
        bytes memory key,
        bytes[] calldata proof,
        bytes32 root
    ) public pure returns (bytes memory) {
        bytes[] memory keys = new bytes[](1);
        keys[0] = key;
        bytes memory rlp = root.VerifyEthereumProof(proof, keys)[0].value;
        return rlp;
    }

    /**
     * @dev validate the transaction proof and receipt proof
     * @param cid chainId of the send chain
     * @param key key of the transaction
     * @param receiptProof receipt proof
     * @param transactionProof transaction proof
     * @param blockHash block hash of the transaction
     */
    function validateTransactionProof(
        uint256 cid,
        bytes memory key,
        bytes[] calldata receiptProof,
        bytes[] calldata transactionProof,
        bytes32 blockHash
    ) external nonReentrant {
        Chain storage chain = _chains[cid];
        IFullCheckpoint csc = chain.csc;
        require(csc != IFullCheckpoint(address(0)), "chainId not registered");

        (, bytes32 transactionsRoot, bytes32 receiptRoot) = csc.getRoots(
            blockHash
        );

        bytes memory receiptRlp = getRlp(key, receiptProof, receiptRoot);

        require(receiptRlp.length > 0, "invalid receipt proof");

        Receipt memory receipt = getReceipt(receiptRlp);

        bytes memory transactionRlp = getRlp(
            key,
            transactionProof,
            transactionsRoot
        );

        require(transactionRlp.length > 0, "invalid transaction proof");
        Transaction memory transaction = getTransaction(transactionRlp);

        for (uint256 i = 0; i < receipt.logs.length; i++) {
            if (
                receipt.logs[i].topics[0] == packetHash() &&
                receipt.logs[i].address_ == address(chain.endpoint)
            ) {
                bytes memory payload = sliceBytes(receipt.logs[i].data);
                // receive send packet data
                (
                    uint256 index,
                    uint256 sid,
                    address sua,
                    uint256 rid,
                    address rua,
                    bytes memory data
                ) = getPayload(payload);

                require(
                    transaction.to == sua,
                    "invalid sender application address"
                );
                require(sid == cid, "invalid packet send chainId");
                require(rid == getChainId(), "invalid packet receive chainId");

                // because call audited rua contract ,so dont need value and gas limit
                rua.functionCall(data);

                emit PacketReceived(index, sid, sua, rid, rua, data);
                chain.lastIndex++;
                break;
            }
        }
    }

    function getChainIndex(uint256 _chainId) external view returns (uint256) {
        return _chainlastIndexes[_chainId];
    }

    function getPayload(
        bytes memory payload
    )
        public
        pure
        returns (
            uint256 index,
            uint256 sid,
            address sua,
            uint256 rid,
            address rua,
            bytes memory data
        )
    {
        (index, sid, sua, rid, rua, data) = abi.decode(
            payload,
            (uint256, uint256, address, uint256, address, bytes)
        );
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
        Endpoint endpoint
    ) external onlyOwner {
        for (uint256 i = 0; i < _chainIds.length; i++) {
            require(_chainIds[i] != chainId, "chainId already registered");
        }
        _chains[chainId].csc = csc;
        _chains[chainId].endpoint = endpoint;

        _chainIds.push(chainId);
        emit ChainRegistered(chainId, csc, endpoint);
    }

    function getTransaction(
        bytes memory transactionRlp
    ) public pure returns (Transaction memory) {
        RLPReader.RLPItem[] memory items = transactionRlp.toRlpItem().toList();

        Transaction memory transaction;
        transaction.to = items[3].toAddress();
        return transaction;
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

    function sliceBytes(bytes memory data) private pure returns (bytes memory) {
        require(data.length >= 64, "Data must be at least 64 bytes long");

        bytes memory slicedData = new bytes(data.length - 64);

        for (uint256 i = 64; i < data.length; i++) {
            slicedData[i - 64] = data[i];
        }

        return slicedData;
    }

    /**
     * @dev get chainId of the current chain
     */
    function getChainId() public view returns (uint256) {
        return block.chainid;
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
        Endpoint endpoint
    ) external onlyOwner {
        _chains[chainId].csc = csc;
        _chains[chainId].endpoint = endpoint;
    }

    /**
     * @dev get chainIds
     */
    function getChainIds() external view returns (uint256[] memory) {
        return _chainIds;
    }

    /**
     * @dev approve rua
     * @param rua rua address
     */
    function approveRua(address rua) external onlyOwner {
        _approvedRua[rua] = true;
    }

    /**
     * @dev revoke rua
     * @param rua rua address
     */
    function revokeRua(address rua) external onlyOwner {
        _approvedRua[rua] = false;
    }

    /**
     * @dev approve sua
     * @param sua sua address
     */
    function approveSua(address sua) external onlyOwner {
        _approvedSua[sua] = true;
    }

    /**
     * @dev revoke sua
     * @param sua sua address
     */
    function revokeSua(address sua) external onlyOwner {
        _approvedSua[sua] = false;
    }
}
