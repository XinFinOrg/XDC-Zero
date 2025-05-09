// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const deploy = require("../deploy.config.json");

async function main() {
  const factory = await hre.ethers.getContractFactory("SimpleToken");

  if (!deploy.subnettoken) {
    console.error("Please set the token config in deploy.config.json");
    return;
  }

  const token = deploy.subnettoken;

  const simpleToken = await factory.deploy(
    token.name,
    token.symbol,
    token.initSupply
  );

  const [deployer] = await hre.ethers.getSigners();
  console.log("SimpleToken deploy start, deployer address:", deployer.address)
  await simpleToken.deployed();
  console.log("ERC20 " + token.name + " deploy to ", simpleToken.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
