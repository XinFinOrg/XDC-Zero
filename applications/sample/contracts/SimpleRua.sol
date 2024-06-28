// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

import "./interfaces/IEndpoint.sol";

contract SimpleRua {
    uint256 public status;
    address private _endpoint;

    modifier onlyEndpoint() {
        require(msg.sender == _endpoint, "only endpoint");
        _;
    }

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function simpleCall(uint256 i) external onlyEndpoint {
        //any thing you want to do for i
        status++;
    }
}
