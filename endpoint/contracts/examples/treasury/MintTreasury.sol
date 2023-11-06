// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./TreasuryToken.sol";

contract MintTreasury {
    //originalToken => TreasuryToken
    mapping(address => TreasuryToken) public treasuryMapping;

    address private _endpoint;

    modifier onlyEndpoint() {
        require(msg.sender == _endpoint, "only endpoint");
        _;
    }

    function init(address endpoint) external {
        _endpoint = endpoint;
    }

    function mint(
        address originalToken,
        string calldata name,
        string calldata symbol,
        address account,
        uint256 amount
    ) external onlyEndpoint {
        TreasuryToken token = treasuryMapping[originalToken];
        if (address(token) == address(0)) {
            token = new TreasuryToken(name, symbol);
            treasuryMapping[originalToken] = token;
        }
        token.mint(account, amount);
    }

    function burn(address token, uint256 amount) public {
        TreasuryToken(token).burnFrom(msg.sender, amount);
    }
}
