process.chdir(__dirname);
const { execSync } = require("child_process");
const fs = require("node:fs");
const env = require("dotenv").config({ path: "mount/.env" });
const config = {
  relativePath: "../applications/subswap/contract/",
};
const endpointConfig = {};

const { ethers } = require("ethers");
const u = require("./util.js");

main();

async function main() {
  console.log("start subswap deploy");
  checkEndpointConfig();
  initSubswapDeploy();
  deploySubswap();
  exportSubswap();
}

function checkEndpointConfig() {
  if (!fs.existsSync("./mount/endpointconfig.json")) {
    if (
      process.env.SUBNET_ZERO_CONTRACT &&
      process.env.PARENTNET_ZERO_CONTRACT
    ) {
      config.subnetEndpoint = process.env.SUBNET_ZERO_CONTRACT;
      config.parentnetEndpoint = process.env.PARENTNET_ZERO_CONTRACT;
      return;
    }
    throw Error(
      "mount/endpointconfig.json not found, and SUBNET_ZERO_CONTRACT and PARENTNET_ZERO_CONTRACT are not configured"
    );
  }

  const epjs = JSON.parse(
    fs.readFileSync("./mount/endpointconfig.json", "utf8")
  );
  if (epjs.xdcsubnet.endpoint && epjs.xdcparentnet.endpoint) {
    config.subnetEndpoint = epjs.xdcsubnet.endpoint;
    config.parentnetEndpoint = epjs.xdcparentnet.endpoint;
    return;
  }
  throw Error("endpoints not found in mount/endpointconfig.json");
}

function initSubswapDeploy() {
  if (process.env.PARENTNET_URL) {
    parentnetURL = process.env.PARENTNET_URL;
    if (parentnetURL == "devnet")
      parentnetURL = "https://devnetstats.apothem.network/devnet";
    if (parentnetURL == "testnet")
      parentnetURL = "https://devnetstats.apothem.network/testnet";
  } else {
    throw Error("PARENTNET_URL not found");
  }

  const reqENV = ["SUBNET_PK", "PARENTNET_PK", "SUBNET_URL"];
  const isEnabled = reqENV.every((envVar) => envVar in process.env);
  if (!isEnabled) {
    throw Error("incomplete ENVs, require SUBNET_PK, PARENTNET_PK, SUBNET_URL");
  }
  subnetPK = process.env.SUBNET_PK.startsWith("0x")
    ? process.env.SUBNET_PK
    : `0x${process.env.SUBNET_PK}`;
  parentnetPK = process.env.PARENTNET_PK.startsWith("0x")
    ? process.env.PARENTNET_PK
    : `0x${process.env.PARENTNET_PK}`;
  subnetURL = process.env.SUBNET_URL;

  config["subnetPK"] = subnetPK;
  config["parentnetPK"] = parentnetPK;
  config["subnetURL"] = subnetURL;
  config["parentnetURL"] = parentnetURL;
}

function deploySubswap() {
  console.log("writing network config");
  u.writeNetworkJson(config);
  console.log("writing deploy.config.json");
  writeSubswapDeployJson();

  console.log("configuring PK");
  u.writeEnv(config.subnetPK, config.relativePath);
  console.log("deploying subswap on subnet");
  subnetEndpointOut = u.callExec(
    "cd ../applications/subswap/contract; npx hardhat run scripts/subnettreasurydeploy.js --network xdcsubnet"
  );
  subnetSubswapAddr = parseEndpointOutput(subnetEndpointOut);

  console.log("configuring PK");
  u.writeEnv(config.parentnetPK, config.relativePath);
  console.log("deploying subswap on parentnet");
  parentnetEndpointOut = u.callExec(
    "cd ../applications/subswap/contract; npx hardhat run scripts/parentnettreasurydeploy.js --network xdcparentnet"
  );
  parentnetSubswapAddr = parseEndpointOutput(parentnetEndpointOut);

  config["subnetSubswap"] = subnetSubswapAddr;
  config["parentnetSubswap"] = parentnetSubswapAddr;
}

function exportSubswap() {
  finalSubnet = "SUBNET_APP=" + config.subnetSubswap;
  finalParentnet = "PARENTNET_APP=" + config.parentnetSubswap;

  console.log(
    "SUCCESS deploy subswap. Before register application step, please include the following into your .env "
  );
  console.log(finalSubnet);
  console.log(finalParentnet);
}
function writeSubswapDeployJson() {
  deployJson = {
    subnetendpoint: config.subnetEndpoint,
    parentnetendpoint: config.parentnetEndpoint,
  };
  fs.writeFileSync(
    "../applications/subswap/contract/deploy.config.json",
    JSON.stringify(deployJson, null, 2),
    "utf-8",
    (err) => {
      if (err) {
        throw Error("error writing deploy.config.json, " + err);
      }
    }
  );
}

function parseEndpointOutput(outString) {
  strArr = outString.split("\n");
  lastLine = strArr[strArr.length - 1];
  if (lastLine == "") {
    strArr.pop();
    lastLine = strArr[strArr.length - 1];
  }
  if (lastLine.includes("0x")) {
    idx = lastLine.indexOf("0x");
    address = lastLine.slice(idx, idx + 42);
    return address;
  } else {
    throw Error("invalid output string: " + outString);
  }
}
