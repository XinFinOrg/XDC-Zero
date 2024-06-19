# Sample contract

## Deployment Guide

### Check `deploy.config.json` File

1. Open the `deploy.config.json` file.
2. Check the values of `parentnetendpoint` and `subnetendpoint`.
   - `parentnetendpoint`: The endpoint contract address on Parentnet.
   - `subnetendpoint`: The endpoint contract address on Subnet.
3. Check the values of `rua` and `sua`.
   - `rua`: The rua contract address on Parentnet.
   - `sua`: The sua contract address on Subnet.

### Deploy Subswap

#### Method 1: Using Hardhat Scripts

1. Install Hardhat and dependencies:

```
yarn
```

2. Deploy the Rua contract:

```
npx hardhat run scripts/ruaDeploy.js --network xdcparentnet
```

3. Deploy the Sua contract:

```
npx hardhat run scripts/suaDeploy.js --network xdcsubnet
```

4. Check the Rua Contract Status:

```
npx hardhat run scripts/ruaStatus.js --network xdcparentnet
```

5. Call the Sua contract:

```
npx hardhat run scripts/suaCall.js --network xdcsubnet
```

6. Check the Rua Contract Status:

```
npx hardhat run scripts/ruaStatus.js --network xdcparentnet
```
