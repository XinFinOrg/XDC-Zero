// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("MintTreasury");

  const mintTreasury = await factory.deploy("0xe974de4A684bb358Bc9141Cd0187010e998854F5");

  await mintTreasury.deployed();

  console.log("MintTreasury deploy to ", mintTreasury.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
