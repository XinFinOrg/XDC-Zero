// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../deploy.config.json");

async function main() {
  const factory = await hre.ethers.getContractFactory("SimpleSua");

  const sua = factory.attach(deploy.sua);

  const endpointFactory = await hre.ethers.getContractFactory("IEndpoint");

  const endpointAddress = await sua._endpoint();

  const endpoint = endpointFactory.attach(endpointAddress);

  const registered = await endpoint.allowanceSua(deploy.sua);

  if (!registered) {
    console.error("SimpleSua not registered with endpoint");
    return;
  }

  await sua.simpleCall(deploy.rid, deploy.rua);

  console.log("SimpleSua simpleCall success");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
