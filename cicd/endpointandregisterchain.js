process.chdir(__dirname)
const { execSync } = require("child_process");
const fs = require('node:fs');
const env = require("dotenv").config({path: 'mount/.env'});
const config = {}
const endpointConfig = {}

const { ethers } = require('ethers')
const u = require('./util.js')

main()

async function main(){
  initEndpointDeploy()
  await getNetworkID()
  deployEndpoint()
  configureEndpointJson()
  registerEndpoint()
  exportEndpointJson()
}

function initEndpointDeploy(){
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
  
}

function configureEndpointJson(){
  endpointConfig["xdcsubnet"]={
    "endpoint": config.subnetEndpoint,
    "registers":[
      {
        "csc": config.reverseCSC,
        "endpoint": config.parentnetEndpoint,
        "chainId": config.parentnetID
      }
    ],
    "applications":[]
  }
  endpointConfig["xdcparentnet"]={
    "endpoint": config.parentnetEndpoint,
    "registers":[
      {
        "csc": config.csc,
        "endpoint": config.subnetEndpoint,
        "chainId": config.subnetID
      }
    ],
    "applications":[]
  }
  
  console.log("writing endpointconfig.json")
  fs.writeFileSync('../endpoint/endpointconfig.json', JSON.stringify(endpointConfig, null, 2) , 'utf-8', err => {
    if (err) {
      throw Error("error writing endpointconfig.json, "+err)
    } 
  });
}

function exportEndpointJson(){
  fs.copyFileSync('../endpoint/endpointconfig.json', './mount/endpointconfig.json')
  ep = fs.readFileSync('../endpoint/endpointconfig.json').toString()
  console.log("SUCCESS deploy endpoint and register chain, endpointconfig:")
  console.log(ep)
}

function deployEndpoint(){
  console.log("writing network config")
  writeEndpointNetworkJson()
  console.log("configuring PK")
  u.writeEndpointEnv(config.subnetPK)
  console.log("deploying subnet endpoint")
  subnetEndpointOut = u.callExec("cd ../endpoint; npx hardhat run scripts/endpointdeploy.js --network xdcsubnet")
  subnetZeroEndpoint = parseEndpointOutput(subnetEndpointOut)

  console.log("configuring PK")
  u.writeEndpointEnv(config.parentnetPK)
  console.log("deploying parentnet endpoint")
  parentnetEndpointOut = u.callExec("cd ../endpoint; npx hardhat run scripts/endpointdeploy.js --network xdcparentnet")
  parentnetZeroEndpoint = parseEndpointOutput(parentnetEndpointOut)

  config["subnetEndpoint"] = subnetZeroEndpoint
  config["parentnetEndpoint"] = parentnetZeroEndpoint
}

function registerEndpoint(){
  console.log("writing network config")
  writeEndpointNetworkJson()
  console.log("configuring PK")
  u.writeEndpointEnv(config.subnetPK)
  console.log("register parentnet to subnet endpoint")
  subnetEndpointOut = u.callExec("cd ../endpoint; npx hardhat run scripts/registerchain.js --network xdcsubnet")
  if (!subnetEndpointOut.includes("success")) throw Error("failed to register parentnet endpoint to subnet")

  console.log("configuring PK")
  u.writeEndpointEnv(config.parentnetPK)
  console.log("register subnet to parentnet endpoint")
  parentnetEndpointOut = u.callExec("cd ../endpoint; npx hardhat run scripts/registerchain.js --network xdcparentnet")
  if (!parentnetEndpointOut.includes("success")) throw Error("failed to register subnet endpoint to parentnet")

}

function writeEndpointNetworkJson(){
  u.writeEndpointNetworkJson(config.subnetURL, config.parentnetURL)
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

async function getNetworkID(){
  [subID, parentID] = await u.getNetworkID(config.subnetURL, config.parentnetURL)
  
  config["subnetID"] = subID
  config["parentnetID"] = parentID
}

