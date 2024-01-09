// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {ERC20Burnable, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TreasuryToken is ERC20Burnable, Ownable {
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {}

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}
