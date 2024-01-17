// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import "../interfaces/IEndpoint.sol";

contract SimpleRua {
    uint256 public status;
    address private _endpoint;

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function simpleCall() external {
        require(_endpoint == msg.sender, "only endpoint");
        status++;
    }
}
