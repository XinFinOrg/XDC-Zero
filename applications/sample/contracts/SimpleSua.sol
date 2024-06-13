// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;
import "../interfaces/IEndpoint.sol";

contract SimpleSua {
    address private _endpoint;

    constructor(address endpoint) {
        _endpoint = endpoint;
    }

    function data() public pure returns (bytes memory) {
        return abi.encodeWithSelector(bytes4(keccak256("simpleCall()")));
    }

    function simpleCall(uint256 rid, address rua) external {
        IEndpoint(_endpoint).send(rid, rua, data());
    }
}
