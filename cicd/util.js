process.chdir(__dirname)
const { execSync } = require("child_process");
const fs = require('node:fs');
const env = require("dotenv").config({path: 'mount/.env'});

const { ethers } = require('ethers')


function writeEndpointEnv(key){
  content = "PRIVATE_KEY="+key
  fs.writeFileSync('../endpoint/.env', content, err => {
    if (err) {
      throw Error("error writing endpoint env, "+err)
    }
  });
}

function writeSubswapEnv(key){ //refactor
  content = "PRIVATE_KEY="+key
  fs.writeFileSync('../applications/subswap/contract/.env', content, err => {
    if (err) {
      throw Error("error writing endpoint env, "+err)
    }
  });
}

function writeEndpointNetworkJson(subnetURL, parentnetURL){
  networkJson = {
    "xdcsubnet": subnetURL,
    "xdcparentnet": parentnetURL,
  }
  fs.writeFileSync('../endpoint/network.config.json', JSON.stringify(networkJson, null, 2) , 'utf-8', err => {
    if (err) {
      throw Error("error writing network.config.json, "+err)
    } 
  });
}

function writeSubswapNetworkJson(subnetURL, parentnetURL){ //refactor
  networkJson = {
    "xdcsubnet": subnetURL,
    "xdcparentnet": parentnetURL,
  }
  fs.writeFileSync('../applications/subswap/contract/network.config.json', JSON.stringify(networkJson, null, 2) , 'utf-8', err => {
    if (err) {
      throw Error("error writing network.config.json, "+err)
    } 
  });
}


function callExec(command){
  try{
    // const stdout = execSync(command,{timeout: 12000})
    const stdout = execSync(command)
    output = stdout.toString()
    // console.log(`${stdout}`);
    console.log(output);
    return output
  } catch (error){
    if (error.code) {
      // Spawning child process failed
      if (error.code == "ETIMEDOUT"){
        throw Error("Timed out (120 seconds)")
      } else {
        throw Error(error)
      }
    } else {
      // Child was spawned but exited with non-zero exit code
      // Error contains any stdout and stderr from the child
      // const { stdout, stderr } = error;
      // console.error({ stdout, stderr });
      throw Error(error)
    }
  }
}

async function getNetworkID(subnetURL, parentnetURL){
  console.log("getting chain ID")
  const subRPC = new ethers.providers.JsonRpcProvider(subnetURL)
  subID = await subRPC.getNetwork()
  subID = subID.chainId.toString()
  console.log("subnet chain ID:", subID)
  
  const parentRPC = new ethers.providers.JsonRpcProvider(parentnetURL)
  parentID = await parentRPC.getNetwork()
  parentID = parentID.chainId.toString()
  console.log("parentnet chain ID:", parentID)
  console.log()

  return [subID, parentID]
}

module.exports = {
  getNetworkID,
  writeEndpointEnv,
  writeSubswapEnv,
  writeEndpointNetworkJson,
  writeSubswapNetworkJson,
  callExec,
}