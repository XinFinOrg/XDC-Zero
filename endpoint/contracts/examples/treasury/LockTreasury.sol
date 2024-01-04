// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {IEndpoint} from "../../interfaces/IEndpoint.sol";

contract LockTreasury {
    using SafeERC20 for IERC20Metadata;

    address private _endpoint;

    uint256 private _rid;

    address private _rua;

    modifier onlyEndpoint() {
        require(msg.sender == _endpoint, "only endpoint");
        _;
    }

    constructor(address endpoint, uint256 rid, address rua) {
        _endpoint = endpoint;
        _rid = rid;
        _rua = rua;
    }

    function lock(address token, uint256 amount, address recv) external {
        IERC20Metadata(token).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        string memory name = IERC20Metadata(token).name();
        string memory symbol = IERC20Metadata(token).symbol();
        bytes memory data = abi.encodeWithSelector(
            bytes4(
                keccak256("mint(address,string,string,address,uint256,uint256)")
            ),
            token,
            name,
            symbol,
            recv,
            amount,
            getChainId()
        );
        IEndpoint(_endpoint).send(_rid, _rua, data);
    }

    function unlock(
        address token,
        uint256 amount,
        address recv
    ) external onlyEndpoint {
        IERC20Metadata(token).safeTransfer(recv, amount);
    }

    function setEndpoint(address endpoint) external onlyEndpoint {
        _endpoint = endpoint;
    }

    /**
     * @dev get chainId of the current chain
     */
    function getChainId() public view returns (uint256) {
        return block.chainid;
    }
}
