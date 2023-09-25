// SPDX-License-Identifier: MIT
pragma solidity =0.8.19;

import {IFullCheckpoint} from "./interfaces/IFullCheckpoint.sol";

contract Endpoint {

    struct Config {
        IFullCheckpoint checkpoint;
    }

    Config private _config;

    uint256 private _initialized;

    function initializer(Config calldata config) external {
        require(_initialized == 0, "already initialized");
        _config = config;
        _initialized = 1;
    }
}
