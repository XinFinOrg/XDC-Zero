// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LockTreasury {
    using SafeERC20 for IERC20;

    function lock(address token, uint256 amount) public {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function unlock(address token, uint256 amount) public {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
