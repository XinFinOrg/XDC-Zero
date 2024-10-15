// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

import {ERC20Burnable, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract SimpleToken is ERC20Burnable {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initSupply
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, initSupply * 1 ether);
    }
}
