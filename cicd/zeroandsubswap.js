process.chdir(__dirname);
const { ethers } = require("ethers");
const fs = require("node:fs");
const u = require("./util.js");
u.loadContractENV()
const e = require("./endpointandregisterchain.js")
const s = require("./subswap.js")
const a = require("./applicationregister.js")

main();

async function main(){
  const step1ENV = await e.endpointAndRegisterChain()
  for (const [key, value] of Object.entries(step1ENV)) {
    u.replaceOrAddENV('./mount/contract_deploy.env', key, value)
    u.replaceOrAddENV('./mount/common.env', key, value)
  }
  u.loadContractENV()

  const step2ENV = await s.subswap()
  for (const [key, value] of Object.entries(step2ENV)) {
    u.replaceOrAddENV('./mount/contract_deploy.env', key, value)
    u.replaceOrAddENV('./mount/common.env', key, value)
  }
  u.loadContractENV()

  await a.applicationRegister()
  
  await setupSubnetWallets()
}

async function setupSubnetWallets(){
  u.loadCommonENV()
  if (!fs.existsSync('./mount/keys.json')) {
    throw Error(`could not modify ${filepath}, file not mounted`)
  } 
  const grandmasterPK = JSON.parse(fs.readFileSync('./mount/keys.json', 'utf8')).Grandmaster.PrivateKey

  try{
    new ethers.Wallet(process.env.SUBNET_WALLET_PK)
    new ethers.Wallet(process.env.SUBNET_ZERO_WALLET_PK)
    new ethers.Wallet(grandmasterPK)
  }catch(error){
    console.log(error)
    console.log('failed to setup wallets, invalid PK')
    process.exit()
  }
 
  await u.transferTokens(process.env.SUBNET_URL, grandmasterPK, process.env.SUBNET_WALLET_PK, 10000)  
  await u.transferTokens(process.env.SUBNET_URL, grandmasterPK, process.env.SUBNET_ZERO_WALLET_PK, 10000)  

}
