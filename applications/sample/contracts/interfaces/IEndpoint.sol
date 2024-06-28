// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

contract IEndpoint {
    function send(uint256 rid, address rua, bytes calldata data) external {}

    function allowanceSua(address sua) external view returns (bool) {}
}
