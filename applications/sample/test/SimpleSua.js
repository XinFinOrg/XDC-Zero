// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("simple sua", () => {
  const fixture = async () => {};

  beforeEach("deploy fixture", async () => {
    ({} = await loadFixture(fixture));
  });
});
