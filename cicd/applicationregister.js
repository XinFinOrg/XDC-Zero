process.chdir(__dirname);
const fs = require("node:fs");
const config = {relativePath: "../endpoint/"};
const endpointConfig = {};
const u = require("./util.js");
u.loadContractENV()

if (require.main === module) {
  applicationRegister();
}

async function applicationRegister() {
  console.log("start application register");
  importEndpointJson();
  initApplicationRegister();
  await u.getNetworkID(config);
  configureEndpointJson();
  registerApplication();
  exportEndpointJson();
}

function importEndpointJson() {
  if (!fs.existsSync("./mount/endpointconfig.json")) {
    if (
      process.env.SUBNET_ZERO_CONTRACT &&
      process.env.PARENTNET_ZERO_CONTRACT
    ) {
      config.subnetEndpoint = process.env.SUBNET_ZERO_CONTRACT;
      config.parentnetEndpoint = process.env.PARENTNET_ZERO_CONTRACT;
    } else {
      throw Error(
        "mount/endpointconfig.json not found, and SUBNET_ZERO_CONTRACT and PARENTNET_ZERO_CONTRACT are not configured"
      );
    }
    endpointConfig["xdcsubnet"] = {
      endpoint: config.subnetEndpoint,
      applications: [],
    };
    endpointConfig["xdcparentnet"] = {
      endpoint: config.parentnetEndpoint,
      applications: [],
    };
    return;
  }

  const epjs = JSON.parse(
    fs.readFileSync("./mount/endpointconfig.json", "utf8")
  );
  if (epjs.xdcsubnet.endpoint && epjs.xdcparentnet.endpoint) {
    endpointConfig["xdcsubnet"] = epjs.xdcsubnet;
    endpointConfig["xdcparentnet"] = epjs.xdcparentnet;
  } else {
    throw Error("invalid endpointconfig.json format");
  }
}

function initApplicationRegister() {
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
    "SUBNET_APP",
    "PARENTNET_APP",
    "SUBNET_URL",
  ];
  const isEnabled = reqENV.every((envVar) => envVar in process.env);
  if (!isEnabled) {
    throw Error(
      "incomplete ENVs, require SUBNET_PK, PARENTNET_PK, SUBNET_APP, PARENTNET_APP, SUBNET_URL"
    );
  }
  subnetPK = process.env.SUBNET_PK.startsWith("0x")
    ? process.env.SUBNET_PK
    : `0x${process.env.SUBNET_PK}`;
  parentnetPK = process.env.PARENTNET_PK.startsWith("0x")
    ? process.env.PARENTNET_PK
    : `0x${process.env.PARENTNET_PK}`;
  subnetApp = process.env.SUBNET_APP.startsWith("0x")
    ? process.env.SUBNET_APP
    : `0x${process.env.SUBNET_APP}`;
  parentnetApp = process.env.PARENTNET_APP.startsWith("0x")
    ? process.env.PARENTNET_APP
    : `0x${process.env.PARENTNET_APP}`;
  subnetURL = process.env.SUBNET_URL;

  config["subnetPK"] = subnetPK;
  config["parentnetPK"] = parentnetPK;
  config["subnetURL"] = subnetURL;
  config["parentnetURL"] = parentnetURL;
  config["subnetApp"] = subnetApp;
  config["parentnetApp"] = parentnetApp;
}

function configureEndpointJson() {
  subApp = {
    rid: config.parentnetID,
    rua: config.parentnetApp,
    sua: config.subnetApp,
  };
  parentApp = {
    rid: config.subnetID,
    rua: config.subnetApp,
    sua: config.parentnetApp,
  };

  existingSubApps = endpointConfig.xdcsubnet.applications;
  existingParentApps = endpointConfig.xdcparentnet.applications;

  if (!(Array.isArray(existingSubApps) && Array.isArray(existingParentApps))) {
    endpointConfig.xdcsubnet.applications = [subApp];
    endpointConfig.xdcparentnet.applications = [parentApp];
  } else {
    subDupe = false;
    for (var i = 0; i < existingSubApps.length; i++) {
      if (
        existingSubApps[i].rid == subApp.rid &&
        existingSubApps[i].rua == subApp.rua &&
        existingSubApps[i].sua == subApp.sua
      ) {
        subDupe = true;
        break;
      } //don't append if app already exists
    }
    if (!subDupe) endpointConfig.xdcsubnet.applications.push(subApp);

    parentDupe = false;
    for (var i = 0; i < existingParentApps.length; i++) {
      if (
        existingParentApps[i].rid == parentApp.rid &&
        existingParentApps[i].rua == parentApp.rua &&
        existingParentApps[i].sua == parentApp.sua
      ) {
        parentDupe = true;
        break;
      } //don't append if app already exists
    }
    if (!parentDupe) endpointConfig.xdcparentnet.applications.push(parentApp);
  }
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

function registerApplication() {
  console.log("writing network config");
  u.writeNetworkJson(config);
  console.log("configuring PK");
  u.writeEnv(config.subnetPK, config.relativePath);
  console.log("register parentnet application to subnet");
  subnetEndpointOut = u.callExec(
    "cd ../endpoint; npx hardhat run scripts/registerapplications.js --network xdcsubnet"
  );
  if (!subnetEndpointOut.includes("success"))
    throw Error("failed to register parentnet app to subnet");

  console.log("configuring PK");
  u.writeEnv(config.parentnetPK, config.relativePath);
  console.log("register subnet application to parentnet endpoint");
  parentnetEndpointOut = u.callExec(
    "cd ../endpoint; npx hardhat run scripts/registerapplications.js --network xdcparentnet"
  );
  if (!parentnetEndpointOut.includes("success"))
    throw Error("failed to register subnet app to parentnet");
}

function exportEndpointJson() {
  fs.copyFileSync(
    "../endpoint/endpointconfig.json",
    "./mount/endpointconfig.json"
  );
  ep = fs.readFileSync("../endpoint/endpointconfig.json").toString();
  console.log("SUCCESS register application, endpointconfig:");
  console.log(ep);
}

module.exports = {
  applicationRegister,
};
