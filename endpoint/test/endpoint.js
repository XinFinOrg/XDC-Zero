const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("xdc zero endpoint", () => {
  let endpoint;

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

    return { endpoint };
  };

  beforeEach("deploy fixture", async () => {
    ({ endpoint } = await loadFixture(fixture));
  });

  describe("test endpoint", () => {
    it("should get tx", async () => {
      const rlp = await endpoint.getRlp(
        "0x01",
        [
          "0xf851a02f4772607a23a8ab42afb9757433de15f33d478aa8c7c209df899107fcea665880808080808080a0860bf50c8c848bf8748c0600538f627b34dea449370f05fb8f56ca2fa664f1ec8080808080808080",
          "0xf86b31b868f86601840ee6b28082520894de5b54e8e7b585153add32f472e8d545e5d42a8280808301e0dfa0d58ebee4d64b6eb116ef37c5863cd054ef059a7def51b203c124c1ba52e6dd8ca0289c889823ba0444cce0a68c44bcf4e774f2ef8e8f4d299e92086bf9a6a6cebf",
        ],
        "0x986d2cce27ce4c92e7512e694f574099a8b88a7846dcf56adf4884f92b0a7c7a"
      );

      const tx = await endpoint.getTransaction(rlp);

      expect(tx.to).to.equal("0xDe5b54E8e7B585153Add32F472e8D545E5d42A82");
    });

    it("should get receipt", async () => {
      const rlp = await endpoint.getRlp(
        "0x01",
        [
          "0xf851a090906718e09d273ae6c1d82defac9872698adeb2ce6f6903df85ffbc7406d90780808080808080a075199a8074701b5331331f47a6af7c618b03190fdab9615f091e12f7709ff1ab8080808080808080",
          "0xf9010f31b9010bf9010801825208b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c0",
        ],
        "0x91e8e52a690eb690a6a69e08b9113f0524bf67284c93f5a32303ad1c92ef2228"
      );

      const receipt = await endpoint.getReceipt(rlp);

      expect(receipt.postStateOrStatus).to.equal("0x01");
      expect(receipt.cumulativeGasUsed).to.equal("21000");
      expect(receipt.bloom).to.equal(
        "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
      expect(receipt.logs).to.deep.equal([]);
    });
  });
});
