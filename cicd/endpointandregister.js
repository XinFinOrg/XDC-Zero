process.chdir(__dirname)
const { execSync } = require("child_process");
const fs = require('node:fs');
const env = require("dotenv").config();
const config = {}
const endpointConfig = {}

const { Web3 } = require('web3')

main()

async function main(){
  check()
  // console.log(config)
  await getNetworkID()
  deployEndpoint()
  configureEndpoint()
  registerEndpoint()
  // console.log(config) 
}

function configureEndpoint(){
  endpointConfig["xdcsubnet"]={
    "endpoint": config.subnetEndpoint,
    "registers":[
      {
        "csc": config.reverseCSC,
        "endpoint": config.parentnetEndpoint,
        "chainId": config.parentnetID
      }
    ]
  }
  endpointConfig["xdcparentnet"]={
    "endpoint": config.parentnetEndpoint,
    "registers":[
      {
        "csc": config.csc,
        "endpoint": config.subnetEndpoint,
        "chainId": config.subnetID
      }
    ]
  }
  
  console.log("writing endpointconfig.json")
  fs.writeFileSync('../endpoint/endpointconfig.json', JSON.stringify(endpointConfig, null, 2) , 'utf-8', err => {
    if (err) {
      throw Error("error writing endpointconfig.json, "+err)
    } 
  });
}

function check(){
  if (process.env.PARENTNET_URL){
    parentnetURL = process.env.PARENTNET_URL
  } else if (process.env.PARENTNET){
    parentnet = process.env.PARENTNET
    if (parentnet == "devnet") parentnetURL = "https://devnetstats.apothem.network/devnet";
    if (parentnet == "testnet") parentnetURL = "https://devnetstats.apothem.network/testnet";
    if (parentnet == "mainnet") parentnetURL = "https://devnetstats.apothem.network/mainnet";
  } else {
    throw Error("PARENTNET or PARENTNET_URL not found")
  }

  const reqENV = [
    "SUBNET_PK",
    "PARENTNET_PK",
    "SUBNET_URL",
    "CSC",
    "REVERSE_CSC",
  ];
  const isEnabled = reqENV.every(envVar => envVar in process.env)
  if (!isEnabled){
    throw Error("incomplete ENVs, require SUBNET_PK, PARENTNET_PK, SUBNET_URL, CSC, REVERSE_CSC")
  }
  subnetPK = process.env.SUBNET_PK.startsWith("0x") ? process.env.SUBNET_PK : `0x${process.env.SUBNET_PK}`;
  parentnetPK = process.env.PARENTNET_PK.startsWith("0x") ? process.env.PARENTNET_PK : `0x${process.env.PARENTNET_PK}`;
  csc = process.env.CSC.startsWith("0x") ? process.env.CSC : `0x${process.env.CSC}`;
  reverseCSC = process.env.REVERSE_CSC.startsWith("0x") ? process.env.REVERSE_CSC : `0x${process.env.REVERSE_CSC}`;
  subnetURL = process.env.SUBNET_URL;

  // return subnetURL, parentnetURL, subnetPK, parentnetPK, csc, reverseCSC 
  config["subnetPK"] = subnetPK
  config["parentnetPK"] = parentnetPK
  config["subnetURL"] = subnetURL
  config["parentnetURL"] = parentnetURL
  config["csc"] = csc
  config["reverseCSC"] = reverseCSC
  return
}

function writeEndpointEnv(key){
  content = "PRIVATE_KEY="+key
  fs.writeFileSync('../endpoint/.env', content, err => {
    if (err) {
      throw Error("error writing endpoint env, "+err)
    }
  });
}

function deployEndpoint(){
  console.log("writing network config")
  writeEndpointNetworkJson()
  console.log("configuring PK")
  writeEndpointEnv(config.subnetPK)
  console.log("deploying subnet endpoint")
  subnetEndpointOut = callExec("cd ../endpoint; npx hardhat run scripts/endpointdeploy.js --network xdcsubnet")
  subnetZeroEndpoint = parseEndpointOutput(subnetEndpointOut)

  console.log("configuring PK")
  writeEndpointEnv(config.parentnetPK)
  console.log("deploying parentnet endpoint")
  parentnetEndpointOut = callExec("cd ../endpoint; npx hardhat run scripts/endpointdeploy.js --network xdcparentnet")
  parentnetZeroEndpoint = parseEndpointOutput(parentnetEndpointOut)

  // return subnetZeroEndpoint, parentnetZeroEndpoint
  config["subnetEndpoint"] = subnetZeroEndpoint
  config["parentnetEndpoint"] = parentnetZeroEndpoint
}

function registerEndpoint(){
  console.log("writing network config")
  writeEndpointNetworkJson()
  console.log("configuring PK")
  writeEndpointEnv(config.subnetPK)
  console.log("register parentnet to subnet endpoint")
  subnetEndpointOut = callExec("cd ../endpoint; npx hardhat run scripts/registerchain.js --network xdcsubnet")
  // subnetZeroEndpoint = parseEndpointOutput(subnetEndpointOut)

  console.log("configuring PK")
  writeEndpointEnv(config.parentnetPK)
  console.log("register subnet to parentnet endpoint")
  parentnetEndpointOut = callExec("cd ../endpoint; npx hardhat run scripts/registerchain.js --network xdcparentnet")
  // parentnetZeroEndpoint = parseEndpointOutput(parentnetEndpointOut)

}

function writeEndpointNetworkJson(){
  networkJson = {
    "xdcparentnet": config.parentnetURL,
    "xdcsubnet": config.subnetURL,
  }
  fs.writeFileSync('../endpoint/network.config.json', JSON.stringify(networkJson, null, 2) , 'utf-8', err => {
    if (err) {
      throw Error("error writing network.config.json, "+err)
    } 
  });
}

function parseEndpointOutput(outString){
  strArr = outString.split("\n") 
  lastLine = strArr[strArr.length-1]
  if (lastLine == ''){
    strArr.pop()
    lastLine = strArr[strArr.length-1]
  }
  if (lastLine.startsWith("XDCZeroEndpoint")){
    idx = lastLine.indexOf("0x")
    address = lastLine.slice(idx, idx+42)
    return address  
  } else {
    throw Error("invalid output string: "+outString)
  }
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

async function getNetworkID(){
  console.log("getting chainID")
  const sub3 = new Web3(config.subnetURL)
  subID = await sub3.eth.getChainId()
  subID = subID.toString()
  console.log("subnet chain ID:", subID)
  const parent3 = new Web3(config.parentnetURL)
  parentID = await parent3.eth.getChainId()
  parentID = parentID.toString()
  console.log("parentnet chain ID:", parentID)
  console.log()
  
  // return subID.toString(), parentID.toString()
  config["subnetID"] = subID
  config["parentnetID"] = parentID
}

function clean(){

}