const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const {
  loadFixture,
  setCode,
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
    it("test rlp resolve", async () => {
      const res = await endpoint.getReceipt(
        "0xb9048402f9048001830169a8b9010000000000000000000000000000000000000000000000001000000002000000000000000000800000000000100000400000000000000000000000000000000000004000800000000000000008000000000000000000000000000000000000000000000000020000000000000000000800000000000000000000000012000000000080000000000000000000000000000000000000280000000200000000000000000000002000000000000001000000000000000000000000000000000000000000000002000000020000004000000000000000000000000000000000000020000000000002000000000000000000000000000000000000008000000000000000f90375f89b94faa9365d018d7f3984a4fce381be157d8801b6aef863a0ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3efa0000000000000000000000000d602735eaeb1e81b673e456c631209c95fac446aa00000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000002d5d0d5669e6e9dc0000f901da94200760f7380b93dec8dfe03a23c38fa8d46e3949e1a0e9bded5f24a4168e4f3bf44e00298c993b22376aad8c58c7dda9718a54cbea82b901a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000003300000000000000000000000046638164b514b9d19a4ab3e35c62df5e107e7f27000000000000000000000000000000000000000000000000000000000000174b000000000000000000000000d6ae154a2901722031a8ed023851296bff7e9e3d00000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000648bc392070000000000000000000000007589d4667b9bd10a93bf918e4eb459f1274bdf93000000000000000000000000000000000000000000002d5d0d5669e6e9dc0000000000000000000000000000d602735eaeb1e81b673e456c631209c95fac446a00000000000000000000000000000000000000000000000000000000f8f99446638164b514b9d19a4ab3e35c62df5e107e7f27e1a0f94f9ef28e17557f777d13ad02f21c0b557bdab8cded7835d95551ba17e25e3eb8c0000000000000000000000000000000000000000000000000000000000000174b000000000000000000000000d6ae154a2901722031a8ed023851296bff7e9e3d0000000000000000000000007589d4667b9bd10a93bf918e4eb459f1274bdf93000000000000000000000000faa9365d018d7f3984a4fce381be157d8801b6ae000000000000000000000000000000000000000000002d5d0d5669e6e9dc0000000000000000000000000000d602735eaeb1e81b673e456c631209c95fac446a"
      );
      console.log(res)
    });
    it("shold be able to send message", async () => {
      await sua.simpleCall(chainId, rua.address);

      const functionSignature = "simpleCall()";

      const functionSelector = ethers.utils
        .id(functionSignature)
        .substring(0, 10);

      const encodedData = ethers.utils.defaultAbiCoder.encode([], []);

      const fullEncodedData = functionSelector + encodedData.substring(2);

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
      expect(values.data).to.eq(fullEncodedData);
    });

    it("should be able receive message use real data", async () => {
      await endpoint.registerChain(
        8851,
        csc.address,
        "0x550491BD078F7c5f78F16395b296E80F82f58700"
      );
      await csc.setRoots(
        "0x11a04c8c119454e0f17afd7ce506f95ec330cc50226ec9fcbe81ebf4e227373d",
        //state root dont care ,but need submit here
        "0x00431d95862e0d79662df4d58926036cb0e327d6775503afc97fab9fac508167",
        "0x00431d95862e0d79662df4d58926036cb0e327d6775503afc97fab9fac508167",
        "0xc14c2c42ee317e9e46388712118034da206cf2225f0fddd5c192913e6af525e0"
      );

      await endpoint.validateTransactionProof(
        8851,
        "0x01",
        [
          "0xf851a0a90d233092ad5f46414d318b83827c35738795720a3881d3d9e1b1c7f91cad5280808080808080a075199a8074701b5331331f47a6af7c618b03190fdab9615f091e12f7709ff1ab8080808080808080",
          "0xf9028e31b9028af902870182d85bb9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000080000000020000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000280000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f9017df9017a94550491bd078f7c5f78f16395b296e80f82f58700e1a0e9bded5f24a4168e4f3bf44e00298c993b22376aad8c58c7dda9718a54cbea82b9014000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000022930000000000000000000000005bc5ea6e43425fa08a03ee7b5d1c1726057e76640000000000000000000000000000000000000000000000000000000000007a690000000000000000000000005bc5ea6e43425fa08a03ee7b5d1c1726057e766400000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000440de221c00000000000000000000000000000000000000000000000000000000",
        ],
        [
          "0xf851a06851f232a2889783161bb1220eb7ae100bffbdd9ad24d0a16b3584eb6adb2df580808080808080a0169ee572a534178abe7e49d8ad7b62d68a85c787015a14b8897e8b703020d6448080808080808080",
          "0xf8b031b8adf8ab23840ee6b280832dc6c0945bc5ea6e43425fa08a03ee7b5d1c1726057e766480b84449ac56cf0000000000000000000000000000000000000000000000000000000000007a690000000000000000000000005bc5ea6e43425fa08a03ee7b5d1c1726057e7664824549a049e409ae2776a49596ab36742369a2228dd15b7196583568d7399b275373a67aa0400592d11a0a52bd9887d72e4a7468ec5094f2c0cc8fdb06579cc449995b68df",
        ],
        "0x11a04c8c119454e0f17afd7ce506f95ec330cc50226ec9fcbe81ebf4e227373d"
      );

      const filter = await endpoint.filters.PacketReceived();

      const logs = await ethers.provider.getLogs(filter);

      const log = logs[0];

      expect(log).to.not.be.undefined;
      expect(log.address).to.eq(endpoint.address);

      expect(log.topics[0]).to.eq(
        ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes(
            "PacketReceived(uint256,uint256,address,uint256,address,bytes)"
          )
        )
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
        log.data
      );

      const functionSignature = "simpleCall()";

      const functionSelector = ethers.utils
        .id(functionSignature)
        .substring(0, 10);

      const encodedData = ethers.utils.defaultAbiCoder.encode([], []);

      const fullEncodedData = functionSelector + encodedData.substring(2);

      expect(values.index).to.eq(1);
      expect(values.sid).to.eq(8851);
      expect(values.rid).to.eq(31337);
      expect(values.sua).to.eq("0x5bC5ea6E43425fa08A03ee7b5D1C1726057E7664");
      expect(values.rua).to.eq("0x5bC5ea6E43425fa08A03ee7b5D1C1726057E7664");
      expect(values.data).to.eq(fullEncodedData);
    });
  });
});
