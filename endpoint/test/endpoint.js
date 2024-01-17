const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("xdc zero endpoint", () => {
  let endpoint;
  let rua;
  let sua;

  const fixture = async () => {
    const EthereumTrieDBLiberary = await hre.ethers.getContractFactory(
      "EthereumTrieDB"
    );

    const EthereumTrieDB = await EthereumTrieDBLiberary.deploy();

    await EthereumTrieDB.deployed();

    const liberary = await hre.ethers.getContractFactory("MerklePatricia", {
      libraries: { EthereumTrieDB: EthereumTrieDB.address },
    });
    const merklePatricia = await liberary.deploy();

    await merklePatricia.deployed();

    const factory = await hre.ethers.getContractFactory("Endpoint", {
      libraries: { MerklePatricia: merklePatricia.address },
    });

    const endpoint = await factory.deploy();

    const ruaFactory = await hre.ethers.getContractFactory("SimpleRua");

    const rua = await ruaFactory.deploy(endpoint.address);

    const suaFactory = await hre.ethers.getContractFactory("SimpleSua");

    const sua = await suaFactory.deploy(endpoint.address);

    return { endpoint, rua, sua };
  };

  beforeEach("deploy fixture", async () => {
    ({ endpoint, rua, sua } = await loadFixture(fixture));
  });

  describe("test endpoint", () => {
    it("shold be able to send message", async () => {
      await sua.simpleCall();
    });
  });
});
