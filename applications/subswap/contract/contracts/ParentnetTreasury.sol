// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {TreasuryToken} from "./TreasuryToken.sol";
import {IEndpoint} from "./interfaces/IEndpoint.sol";

contract ParentnetTreasury {
    //send id=>originalToken => TreasuryToken
    mapping(uint256 => mapping(address => address)) public treasuryMapping;

    address private _endpoint;

    event Mint(
        address originalToken,
        address token,
        address account,
        uint256 amount,
        uint256 chainId
    );

    event Burn(
        uint256 rid,
        address rua,
        address originalToken,
        address token,
        uint256 amount,
        address recv
    );

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
        uint256 sid
    ) external onlyEndpoint {
        address token = treasuryMapping[sid][originalToken];
        if (token == address(0)) {
            token = address(new TreasuryToken(name, symbol));
            treasuryMapping[sid][originalToken] = token;
        }
        TreasuryToken(token).mint(account, amount);
        emit Mint(originalToken, token, account, amount, sid);
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
            originalToken,
            amount,
            recv
        );
        IEndpoint(_endpoint).send(rid, rua, data);
        emit Burn(rid, rua, originalToken, token, amount, recv);
    }

    function setEndpoint(address endpoint) external onlyEndpoint {
        _endpoint = endpoint;
    }

    function getEndpoint() external view returns (address) {
        return _endpoint;
    }

    function test(uint256 rid, address rua, bytes memory data) external {
        IEndpoint(_endpoint).send(rid, rua, data);
    }
}
