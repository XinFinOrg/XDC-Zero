// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";

contract Endpoint is Ownable {
    struct Config {
        IFullCheckpoint checkpoint;
    }

    Config private _config;

    function send() external {}

    function receivePayload() external {}

    function validateTransactionProof() external {}

    function getConfig() external view returns (Config memory) {
        require(
            _config.checkpoint != IFullCheckpoint(address(0)),
            "no checkpoint"
        );
        return _config;
    }

    function setConfig(Config calldata config) external onlyOwner {
        require(
            config.checkpoint != IFullCheckpoint(address(0)),
            "invalid checkpoint"
        );
        _config = config;
    }
}
