// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IEndpoint} from "./interfaces/IEndpoint.sol";

contract SubnetTreasury {
    using SafeERC20 for IERC20Metadata;

    address private _endpoint;

    event Lock(
        uint256 rid,
        address rua,
        address token,
        uint256 amount,
        address recv
    );

    event UnLock(address token, uint256 amount, address recv);

    modifier onlyEndpoint() {
        require(msg.sender == _endpoint, "only endpoint");
        _;
    }

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function lock(
        uint256 rid,
        address rua,
        address token,
        uint256 amount,
        address recv
    ) external {
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
        IEndpoint(_endpoint).send(rid, rua, data);
        emit Lock(rid, rua, token, amount, recv);
    }

    function unlock(
        address token,
        uint256 amount,
        address recv
    ) external onlyEndpoint {
        IERC20Metadata(token).safeTransfer(recv, amount);
        emit UnLock(token, amount, recv);
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

    function getEndpoint() external view returns (address) {
        return _endpoint;
    }
}
