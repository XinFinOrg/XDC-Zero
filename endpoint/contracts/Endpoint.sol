// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

import {RLPReader} from "./libraries/RLPReader.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerklePatricia} from "@polytope-labs/solidity-merkle-trees/src/MerklePatricia.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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

    constructor() Ownable(msg.sender) {}

    /**
     * @dev csc is the checkpoint contract of the receive chain
     * @dev endpoint is the address of the endpoint contract of the send chain
     */
    struct Chain {
        IFullCheckpoint csc;
        Endpoint endpoint;
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

    //receive chainId=>Chain
    mapping(uint256 => Chain) private _sendChains;

    mapping(uint256 => mapping(address => bool)) private _approvedRua;

    mapping(address => bool) private _approvedSua;

    //receive chainId=>lastIndex
    mapping(uint256 => uint256) private _receiveChainLastIndexes;

    //send chainIds
    uint256[] private _sendChainIds;

    //send chainId=> lastIndex
    mapping(uint256 => uint256) private _sendChainLastIndexes;

    mapping(uint256 => bytes[]) public failureData;

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

    event FailureData(
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
        if (!isContract(msg.sender)) {
            sua = address(this);
        }

        require(_approvedSua[sua], "sua not approved");
        require(_approvedRua[rid][rua], "rua not approved");

        uint256 sid = getChainId();

        _receiveChainLastIndexes[rid]++;
        bytes memory payload = abi.encode(
            _receiveChainLastIndexes[rid],
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
     * @param csid chainId of the send chain
     * @param key key of the transaction
     * @param receiptProof receipt proof
     * @param transactionProof transaction proof
     * @param blockHash block hash of the transaction
     */
    function validateTransactionProof(
        uint256 csid,
        bytes memory key,
        bytes[] calldata receiptProof,
        bytes[] calldata transactionProof,
        bytes32 blockHash
    ) external nonReentrant {
        Chain storage sendChain = _sendChains[csid];
        IFullCheckpoint csc = sendChain.csc;
        require(csc != IFullCheckpoint(address(0)), "chainId not registered");

        (, bytes32 transactionsRoot, bytes32 receiptRoot) = csc.getRoots(
            blockHash
        );

        require(transactionsRoot > bytes32(0), "invalid transactionsRoot");
        require(receiptRoot > bytes32(0), "invalid receiptRoot");

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
                receipt.logs[i].address_ == address(sendChain.endpoint)
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
                    _sendChainLastIndexes[csid] + 1 == index,
                    "invailid index"
                );

                require(
                    transaction.to == sua,
                    "invalid sender application address"
                );
                require(sid == csid, "invalid packet send chainId");
                require(rid == getChainId(), "invalid packet receive chainId");

                // because call audited rua contract ,so dont need value and gas limit

                bool success;
                (success, ) = rua.call{value: 0}(data);
                if (!success) {
                    //simply ignore hanlde
                    failureData[rid].push(payload);
                    emit FailureData(index, sid, sua, rid, rua, data);
                }

                emit PacketReceived(index, sid, sua, rid, rua, data);
                _sendChainLastIndexes[csid]++;
                break;
            }
        }
    }

    function getFailureDataLength(uint256 rid) external view returns (uint256) {
        return failureData[rid].length;
    }

    // get receive chain last index
    function getReceiveChainLastIndex(
        uint256 _chainId
    ) external view returns (uint256) {
        return _receiveChainLastIndexes[_chainId];
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
     * @dev register a receive chain
     * @param chainId chainId of the send chain
     * @param csc checkpoint contract of the receive chain
     * @param endpoint endpoint contract of the send chain
     */
    function registerChain(
        uint256 chainId,
        IFullCheckpoint csc,
        Endpoint endpoint
    ) external onlyOwner {
        _sendChains[chainId].csc = csc;
        _sendChains[chainId].endpoint = endpoint;
        _sendChainIds.push(chainId);
        emit ChainRegistered(chainId, csc, endpoint);
    }

    function getTransaction(
        bytes memory transactionRlp
    ) public pure returns (Transaction memory) {
        RLPReader.RLPItem[] memory items = transactionRlp.toRlpItem().toList();
        Transaction memory transaction;

        if (items[3].len == 21) {
            transaction.to = items[3].toAddress();
        } else {
            transaction.to = items[5].toAddress();
        }

        return transaction;
    }

    /**
     * @dev get receipt from rlp
     * @param receiptRlp receipt rlp
     */
    function getReceipt(
        bytes memory receiptRlp
    ) public pure returns (Receipt memory) {
        RLPReader.RLPItem[] memory items;
        items = receiptRlp.toRlpItem().toList();

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

    function sliceBytes(bytes memory data) public pure returns (bytes memory) {
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
    function getSendChain(
        uint256 chainId
    ) external view returns (Chain memory chain) {
        chain = _sendChains[chainId];
    }

    /**
     * @dev get receive chainIds
     */
    function getSendChainIds() external view returns (uint256[] memory) {
        return _sendChainIds;
    }

    /**
     *
     * @param rid receive chainId
     * @param rua receive application address
     * @param sua send application address
     */
    function approveApplication(
        uint256 rid,
        address rua,
        address sua
    ) external onlyOwner {
        approveRua(rid, rua);
        approveSua(sua);
    }

    /**
     *
     * @param rid receive chainId
     * @param rua receive application address
     * @param sua send application address
     */
    function revokeApplication(
        uint256 rid,
        address rua,
        address sua
    ) external onlyOwner {
        revokeRua(rid, rua);
        revokeSua(sua);
    }

    /**
     * @dev approve rua
     * @param rua rua address
     */
    function approveRua(uint256 rid, address rua) public onlyOwner {
        _approvedRua[rid][rua] = true;
    }

    /**
     * @dev revoke rua
     * @param rua rua address
     */
    function revokeRua(uint256 rid, address rua) public onlyOwner {
        _approvedRua[rid][rua] = false;
    }

    /**
     * @dev approve sua
     * @param sua sua address
     */
    function approveSua(address sua) public onlyOwner {
        _approvedSua[sua] = true;
    }

    /**
     * @dev revoke sua
     * @param sua sua address
     */
    function revokeSua(address sua) public onlyOwner {
        _approvedSua[sua] = false;
    }

    /**
     * @dev get allowance of rua
     * @param rid receive chainId
     * @param rua rua address
     */
    function allowanceRua(
        uint256 rid,
        address rua
    ) external view returns (bool) {
        return _approvedRua[rid][rua];
    }

    /**
     * @dev get allowance of sua
     * @param sua sua address
     */
    function allowanceSua(address sua) external view returns (bool) {
        return _approvedSua[sua];
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function getSendChainLastIndex(
        uint256 sid
    ) external view returns (uint256) {
        return _sendChainLastIndexes[sid];
    }
}
