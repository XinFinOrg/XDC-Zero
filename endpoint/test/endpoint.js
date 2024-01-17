const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("xdc zero endpoint", () => {
  let endpoint;
  let rua;
  let sua;
  let chainId;
  let csc;

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

    const cscFactory = await hre.ethers.getContractFactory("SimpleCsc");

    const csc = await cscFactory.deploy();

    const chainId = network.config.chainId;

    await endpoint.registerChain(chainId, csc.address, rua.address);

    await endpoint.approveApplication(chainId, rua.address, sua.address);

    return { endpoint, csc, rua, sua, chainId };
  };

  beforeEach("deploy fixture", async () => {
    ({ endpoint, csc, rua, sua, chainId } = await loadFixture(fixture));
  });

  describe("test endpoint", () => {
    it("shold be able to send message", async () => {
      await sua.simpleCall(chainId, rua.address);

      const data = await sua.data();

      const filter = await endpoint.filters.Packet();

      const logs = await ethers.provider.getLogs(filter);

      const log = logs[0];

      expect(log).to.not.be.undefined;
      expect(log.address).to.eq(endpoint.address);

      expect(log.topics[0]).to.eq(
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Packet(bytes)"))
      );

      const values = ethers.utils.defaultAbiCoder.decode(
        [
          { name: "index", type: "uint" },
          { name: "sid", type: "uint" },
          { name: "sua", type: "address" },
          { name: "rid", type: "uint" },
          { name: "rua", type: "address" },
          { name: "data", type: "bytes" },
        ],
        `0x${log.data.substring(130)}`
      );

      expect(values.index).to.eq(1);
      expect(values.sid).to.eq(chainId);
      expect(values.rid).to.eq(chainId);
      expect(values.sua).to.eq(sua.address);
      expect(values.rua).to.eq(rua.address);
      expect(values.data).to.eq(data);
    });
  });
});
