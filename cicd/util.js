process.chdir(__dirname);
const { execSync } = require("child_process");
const fs = require("node:fs");
const dotenv = require("dotenv")

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

function loadContractENV(){
  dotenv.config({ path: "mount/contract_deploy.env" });
}
function loadCommonENV(){
  dotenv.config({ path: "mount/common.env" });
}

function replaceENV(filepath, replaceENV, replaceValue){
  //check files mounted
  if (!fs.existsSync(filepath)) {
    throw Error(`could not modify ${filepath}, file not mounted`)
  } 
  const envFileContent = fs.readFileSync(filepath, 'utf8');
  const regex = new RegExp(`^${replaceENV}=.*`, 'gm');
  let matches = envFileContent.match(regex);
  matches = (matches === null) ? [] : matches
  
  if (matches.length > 1){
    console.log('Warning: found more than one instance of', replaceENV, 'in', filepath)
    console.log(matches)
  }
  let matchesCount = 0
  const updatedContent = envFileContent.replace(regex, (match) => {
    let replaceString=
`# Commented old value by deployer
# ${matches[matchesCount]}`

    if (matchesCount == matches.length-1) { 
      replaceString+=`\n${replaceENV}=${replaceValue}`
    }
    matchesCount++
    console.log(`Updated ${filepath} file: \n${replaceString}`);
    return replaceString
    });

  fs.writeFileSync(filepath, updatedContent);
  return (updatedContent !== envFileContent)
}

function addENV(filepath, envName, envValue){
  //check files mounted
  if (!fs.existsSync(filepath)) {
    throw Error(`could not modify ${filepath}, file not mounted`)
  } 
  const envFileContent = fs.readFileSync(filepath, 'utf8');
  const appendString = `${envName}=${envValue}`
  const updatedContent = envFileContent+'\n'+appendString
  
  fs.writeFileSync(filepath, updatedContent);
}

function replaceOrAddENV(filepath, envKey, envValue){
  replaced = replaceENV(filepath, envKey, envValue)
  !replaced && addENV(filepath, envKey, envValue)
}

function transferTokens(url, fromAddress, toAddress, amount){

}

module.exports = {
  getNetworkID,
  callExec,
  writeEnv,
  writeNetworkJson,
  loadContractENV,
  loadCommonENV,
  replaceENV,
  addENV,
  replaceOrAddENV,
};
