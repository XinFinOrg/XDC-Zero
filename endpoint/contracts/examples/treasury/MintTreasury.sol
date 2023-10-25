// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./TreasuryToken.sol";

contract MintTreasury {
    //originalToken => TreasuryToken
    mapping(address => TreasuryToken) public treasuryMapping;

    function mint(
        address originalToken,
        address account,
        uint256 amount
    ) public {
        TreasuryToken token = treasuryMapping[originalToken];
        if (address(token) == address(0)) {
            token = new TreasuryToken("T", "T");
            treasuryMapping[originalToken] = token;
        }
        token.mint(account, amount);
    }

    function burn(address token, uint256 amount) public {
        TreasuryToken(token).burnFrom(msg.sender, amount);
    }
}
