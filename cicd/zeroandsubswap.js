process.chdir(__dirname);
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
  
  a.applicationRegister()
}
