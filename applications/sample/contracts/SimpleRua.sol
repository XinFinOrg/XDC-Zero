// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

import "./interfaces/IEndpoint.sol";

contract SimpleRua {
    uint256 public status;
    address public _endpoint;

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function simpleCall(uint256 i) external {
        require(_endpoint == msg.sender, "only endpoint");
        status += i;
    }

    function data() public pure returns (bytes memory) {
        return
            abi.encodeWithSelector(
                bytes4(keccak256("simpleCallReverse(uint256)")),
                1
            );
    }

    function simpleCallReverse(uint256 sid, address sua) external {
        IEndpoint(_endpoint).send(sid, sua, data());
    }
}
