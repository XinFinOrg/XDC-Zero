// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../endpointdeploy.json");

async function main() {
  const networkName = hre.network.name;
  console.log(networkName);

  const EthereumTrieDBLiberary = await hre.ethers.getContractFactory(
    "EthereumTrieDB"
  );

  const EthereumTrieDB = await EthereumTrieDBLiberary.deploy();

  await EthereumTrieDB.deployed();

  console.log("EthereumTrieDB deploy to ", EthereumTrieDB.address);

  const liberary = await hre.ethers.getContractFactory("MerklePatricia", {
    libraries: { EthereumTrieDB: EthereumTrieDB.address },
  });
  const merklePatricia = await liberary.deploy();

  await merklePatricia.deployed();

  console.log("merklePatricia deploy to ", merklePatricia.address);

  const factory = await hre.ethers.getContractFactory("Endpoint", {
    libraries: { MerklePatricia: merklePatricia.address },
  });

  const endpoint = await factory.deploy();

  await endpoint.deployed();

  console.log("XDCZeroEndpoint deploy to ", endpoint.address);

  const deployConfig = deploy[networkName];
  if (deployConfig) {
    const csc = deployConfig.csc;
    const otherSideEndpoint = deployConfig.otherSideEndpoint;
    const otherSideChainId = deployConfig.otherSideChainId;
    const tx = await endpoint.registerChain(
      otherSideChainId,
      csc,
      otherSideEndpoint
    );
    await tx.wait();
    console.log(
      "register chain success csc ",
      csc,
      " otherSideEndpoint ",
      otherSideEndpoint,
      " otherSideChainId ",
      otherSideChainId
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
