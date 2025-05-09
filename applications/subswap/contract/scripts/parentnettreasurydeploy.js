// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../deploy.config.json");

async function main() {
  const factory = await hre.ethers.getContractFactory("ParentnetTreasury");

  const parentnetTreasury = await factory.deploy(deploy.parentnetendpoint);

  await parentnetTreasury.deployed();

  console.log(
    "parentnetTreasury use " + deploy.parentnetendpoint + " as endpoint"
  );

  console.log("parentnetTreasury deploy to ", parentnetTreasury.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
