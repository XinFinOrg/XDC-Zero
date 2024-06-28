// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../deploy.config.json");

async function main() {
  const factory = await hre.ethers.getContractFactory("SimpleRua");

  const rua = factory.attach(deploy.rua);

  const endpointFactory = await hre.ethers.getContractFactory("IEndpoint");

  const endpointAddress = await rua._endpoint();

  const endpoint = endpointFactory.attach(endpointAddress);

  const registered = await endpoint.allowanceSua(deploy.rua);

  if (!registered) {
    console.error("SimpleRua not registered with endpoint");
    return;
  }

  await rua.simpleCallReverse(deploy.sid, deploy.sua);

  console.log("SimpleRua simpleCall success");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
