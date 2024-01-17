// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;
import "../interfaces/IEndpoint.sol";

contract SimpleSua {
    address private _endpoint;

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function simpleCall(uint256 rid, address rua) external {
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("simpleCall()"))
        );
        IEndpoint(_endpoint).send(rid, rua, data);
    }
}
