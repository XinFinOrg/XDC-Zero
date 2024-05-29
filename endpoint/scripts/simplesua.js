// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../deploy.config.json");

async function main() {
<<<<<<<< HEAD:endpoint/scripts/simplesua.js
  const factory = await hre.ethers.getContractFactory("SimpleSua");

  const endpoint = await factory.deploy(
    "0x550491BD078F7c5f78F16395b296E80F82f58700"
  );

  await endpoint.deployed();

  console.log("SimpleSua deploy to ", endpoint.address);
========
  const factory = await hre.ethers.getContractFactory("ParentnetTreasury");

  const parentnetTreasury = await factory.deploy(deploy.parentnetendpoint);

  await parentnetTreasury.deployed();

  console.log("parentnetTreasury deploy to ", parentnetTreasury.address);
>>>>>>>> main:applications/subswap/contract/scripts/parennettreasurydeploy.js
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
