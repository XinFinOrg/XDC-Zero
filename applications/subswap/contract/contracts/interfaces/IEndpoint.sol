// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

interface IEndpoint {
    function send(uint256 rid, address rua, bytes calldata data) external;
}
