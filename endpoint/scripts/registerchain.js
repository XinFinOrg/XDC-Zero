// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../registerchain.json");

async function main() {
  const networkName = hre.network.name;
  console.log(networkName);

  const deployConfig = deploy[networkName];
  if (deployConfig) {
    const endpoint = deployConfig.endpoint;
    const registers = deployConfig.registers;

    const factory = await hre.ethers.getContractFactory("Endpoint", {
      //doesn't care about the address, just need to pass the address to deploy
      libraries: { MerklePatricia: endpoint },
    });

    const endpointContract = await factory.attach(endpoint);

    for (const register of registers) {
      const tx = await endpointContract.registerChain(
        register.chainId,
        register.csc,
        register.endpoint
      );
      await tx.wait();
      console.log(
        "register chain success " +
          JSON.stringify(register) +
          " to current chain endpoint" +
          endpoint
      );
    }
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
