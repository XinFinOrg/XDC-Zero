process.chdir(__dirname);
const fs = require("node:fs");
const config = { relativePath: "../endpoint/" };
const endpointConfig = {};
const u = require("./util.js");
u.loadContractENV();

if (require.main === module) {
  main();
}
async function main() {
  const newENV = await endpointAndRegisterChain();
  for (const [key, value] of Object.entries(newENV)) {
    u.replaceOrAddENV("./mount/contract_deploy.env", key, value);
    u.replaceOrAddENV("./mount/common.env", key, value);
  }
  u.loadContractENV();
}

async function endpointAndRegisterChain() {
  console.log("start endpoint deploy and register chain");
  initEndpointDeploy();
  await u.getNetworkID(config);
  deployEndpoint();
  configureEndpointJson();
  registerEndpoint();
  const newENV = exportEndpointJson();
  return newENV;
}

function initEndpointDeploy() {
  if (process.env.PARENTNET_URL) {
    parentnetURL = process.env.PARENTNET_URL;
    if (parentnetURL == "devnet")
      parentnetURL = "https://devnetstats.apothem.network/devnet";
    if (parentnetURL == "testnet")
      parentnetURL = "https://devnetstats.apothem.network/testnet";
  } else {
    throw Error("PARENTNET_URL not found");
  }

  const reqENV = [
    "SUBNET_PK",
    "PARENTNET_PK",
    "SUBNET_URL",
    "CHECKPOINT_CONTRACT",
    "REVERSE_CHECKPOINT_CONTRACT",
  ];
  const isEnabled = reqENV.every((envVar) => envVar in process.env);
  if (!isEnabled) {
    throw Error(
      "incomplete ENVs, require SUBNET_PK, PARENTNET_PK, SUBNET_URL, CHECKPOINT_CONTRACT, REVERSE_CHECKPOINT_CONTRACT"
    );
  }
  subnetPK = process.env.SUBNET_PK.startsWith("0x")
    ? process.env.SUBNET_PK
    : `0x${process.env.SUBNET_PK}`;
  parentnetPK = process.env.PARENTNET_PK.startsWith("0x")
    ? process.env.PARENTNET_PK
    : `0x${process.env.PARENTNET_PK}`;
  csc = process.env.CHECKPOINT_CONTRACT.startsWith("0x")
    ? process.env.CHECKPOINT_CONTRACT
    : `0x${process.env.CHECKPOINT_CONTRACT}`;
  reverseCSC = process.env.REVERSE_CHECKPOINT_CONTRACT.startsWith("0x")
    ? process.env.REVERSE_CHECKPOINT_CONTRACT
    : `0x${process.env.REVERSE_CHECKPOINT_CONTRACT}`;
  subnetURL = process.env.SUBNET_URL;

  // return subnetURL, parentnetURL, subnetPK, parentnetPK, csc, reverseCSC
  config["subnetPK"] = subnetPK;
  config["parentnetPK"] = parentnetPK;
  config["subnetURL"] = subnetURL;
  config["parentnetURL"] = parentnetURL;
  config["csc"] = csc;
  config["reverseCSC"] = reverseCSC;
}

function configureEndpointJson() {
  endpointConfig["xdcsubnet"] = {
    endpoint: config.subnetEndpoint,
    registers: [
      {
        csc: config.reverseCSC,
        endpoint: config.parentnetEndpoint,
        chainId: config.parentnetID,
      },
    ],
    applications: [],
  };
  endpointConfig["xdcparentnet"] = {
    endpoint: config.parentnetEndpoint,
    registers: [
      {
        csc: config.csc,
        endpoint: config.subnetEndpoint,
        chainId: config.subnetID,
      },
    ],
    applications: [],
  };

  console.log("writing endpointconfig.json");
  fs.writeFileSync(
    "../endpoint/endpointconfig.json",
    JSON.stringify(endpointConfig, null, 2),
    "utf-8",
    (err) => {
      if (err) {
        throw Error("error writing endpointconfig.json, " + err);
      }
    }
  );
}

function exportEndpointJson() {
  fs.copyFileSync(
    "../endpoint/endpointconfig.json",
    "./mount/endpointconfig.json"
  );
  ep = fs.readFileSync("../endpoint/endpointconfig.json").toString();
  console.log("SUCCESS deploy endpoint and register chain, endpointconfig:");
  console.log(ep);
  console.log();
  console.log("SUCCESS deploy endpoint and register chain, env:");
  console.log("SUBNET_ZERO_CONTRACT=" + config.subnetEndpoint);
  console.log("PARENTNET_ZERO_CONTRACT=" + config.parentnetEndpoint);

  return {
    SUBNET_ZERO_CONTRACT: config.subnetEndpoint,
    PARENTNET_ZERO_CONTRACT: config.parentnetEndpoint,
  };
}

function deployEndpoint() {
  console.log("writing network config");
  u.writeNetworkJson(config);
  console.log("configuring PK");
  u.writeEnv(config.subnetPK, config.relativePath);
  console.log("deploying subnet endpoint");
  subnetEndpointOut = u.callExec(
    "cd ../endpoint; npx hardhat run scripts/endpointdeploy.js --network xdcsubnet"
  );
  subnetZeroEndpoint = parseEndpointOutput(subnetEndpointOut);

  console.log("configuring PK");
  u.writeEnv(config.parentnetPK, config.relativePath);
  console.log("deploying parentnet endpoint");
  parentnetEndpointOut = u.callExec(
    "cd ../endpoint; npx hardhat run scripts/endpointdeploy.js --network xdcparentnet"
  );
  parentnetZeroEndpoint = parseEndpointOutput(parentnetEndpointOut);

  config["subnetEndpoint"] = subnetZeroEndpoint;
  config["parentnetEndpoint"] = parentnetZeroEndpoint;
}

function registerEndpoint() {
  console.log("writing network config");
  u.writeNetworkJson(config);
  console.log("configuring PK");
  u.writeEnv(config.subnetPK, config.relativePath);
  console.log("register parentnet to subnet endpoint");
  subnetEndpointOut = u.callExec(
    "cd ../endpoint; npx hardhat run scripts/registerchain.js --network xdcsubnet"
  );
  if (!subnetEndpointOut.includes("success"))
    throw Error("failed to register parentnet endpoint to subnet");

  console.log("configuring PK");
  u.writeEnv(config.parentnetPK, config.relativePath);
  console.log("register subnet to parentnet endpoint");
  parentnetEndpointOut = u.callExec(
    "cd ../endpoint; npx hardhat run scripts/registerchain.js --network xdcparentnet"
  );
  if (!parentnetEndpointOut.includes("success"))
    throw Error("failed to register subnet endpoint to parentnet");
}

function parseEndpointOutput(outString) {
  strArr = outString.split("\n");
  lastLine = strArr[strArr.length - 1];
  if (lastLine == "") {
    strArr.pop();
    lastLine = strArr[strArr.length - 1];
  }
  if (lastLine.startsWith("XDCZeroEndpoint")) {
    idx = lastLine.indexOf("0x");
    address = lastLine.slice(idx, idx + 42);
    return address;
  } else {
    throw Error("invalid output string: " + outString);
  }
}

module.exports = {
  endpointAndRegisterChain,
};
