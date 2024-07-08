process.chdir(__dirname);
const { execSync } = require("child_process");
const fs = require("node:fs");
const env = require("dotenv").config({ path: "mount/.env" });

const { ethers } = require("ethers");

function writeEnv(key, path) {
  content = "PRIVATE_KEY=" + key;
  fullPath = path + "/" + ".env";
  fs.writeFileSync(fullPath, content, (err) => {
    if (err) {
      throw Error(`error writing ${fullPath}, ` + err);
    }
  });
}
function writeNetworkJson(config) {
  networkJson = {
    xdcsubnet: config.subnetURL,
    xdcparentnet: config.parentnetURL,
  };
  writeJson(networkJson, config.relativePath, "network.config.json");
}

function writeJson(obj, path, filename) {
  fullPath = path + "/" + filename;
  fs.writeFileSync(fullPath, JSON.stringify(obj, null, 2), "utf-8", (err) => {
    if (err) {
      throw Error(`error writing ${fullPath}, ` + err);
    }
  });
}

function callExec(command) {
  try {
    const stdout = execSync(command, { timeout: 200000 });
    // const stdout = execSync(command)
    output = stdout.toString();
    // console.log(`${stdout}`);
    console.log(output);
    return output;
  } catch (error) {
    if (error.code) {
      // Spawning child process failed
      if (error.code == "ETIMEDOUT") {
        throw Error("Timed out (200 seconds)");
      } else {
        throw Error(error);
      }
    } else {
      // Child was spawned but exited with non-zero exit code
      // Error contains any stdout and stderr from the child
      // const { stdout, stderr } = error;
      // console.error({ stdout, stderr });
      throw Error(error);
    }
  }
}

async function getNetworkID(config) {
  subnetURL = config.subnetURL;
  parentnetURL = config.parentnetURL;
  console.log("getting chain ID");
  const subRPC = new ethers.providers.JsonRpcProvider(subnetURL);
  subID = await subRPC.getNetwork();
  subID = subID.chainId.toString();
  console.log("subnet chain ID:", subID);

  const parentRPC = new ethers.providers.JsonRpcProvider(parentnetURL);
  parentID = await parentRPC.getNetwork();
  parentID = parentID.chainId.toString();
  console.log("parentnet chain ID:", parentID);
  console.log();

  config["subnetID"] = subID;
  config["parentnetID"] = parentID;
}

module.exports = {
  getNetworkID,
  callExec,
  writeEnv,
  writeNetworkJson,
};
