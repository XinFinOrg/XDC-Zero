// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {TreasuryToken} from "./TreasuryToken.sol";
import {IEndpoint} from "./interfaces/IEndpoint.sol";

contract ParentnetTreasury {

    //chainId=>originalToken => TreasuryToken
    mapping(uint256 => mapping(address => address)) public treasuryMapping;

    address private _endpoint;

    modifier onlyEndpoint() {
        require(msg.sender == _endpoint, "only endpoint");
        _;
    }

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function mint(
        address originalToken,
        string calldata name,
        string calldata symbol,
        address account,
        uint256 amount,
        uint256 chainId
    ) external onlyEndpoint {
        address token = treasuryMapping[chainId][originalToken];
        if (token == address(0)) {
            token = address(new TreasuryToken(name, symbol));
            treasuryMapping[chainId][originalToken] = token;
        }
        TreasuryToken(token).mint(account, amount);
    }

    function burn(
        uint256 rid,
        address rua,
        address originalToken,
        address token,
        uint256 amount,
        address recv
    ) public {
        require(
            token == treasuryMapping[rid][originalToken],
            "token not match"
        );
        TreasuryToken(token).burnFrom(msg.sender, amount);
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("unlock(address,uint256,address)")),
            token,
            amount,
            recv
        );
        IEndpoint(_endpoint).send(rid, rua, data);
    }

    function setEndpoint(address endpoint) external onlyEndpoint {
        _endpoint = endpoint;
    }
}
