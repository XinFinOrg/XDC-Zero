// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("LockTreasury");

  const lockTreasury = await factory.deploy(
    "0x5bC5ea6E43425fa08A03ee7b5D1C1726057E7664",
    551,
    "0xEff102f8321d63Db6794DfD82B0503Aeb6149A17"
  );

  await lockTreasury.deployed();

  console.log("LockTreasury deploy to ", lockTreasury.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
