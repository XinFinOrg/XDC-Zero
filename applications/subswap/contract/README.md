# Subswap contract

## Subswap Deployment Guide

### Check `deploy.config.json` File

1. Open the `deploy.config.json` file.
2. Check the values of `parentnetendpoint` and `subnetendpoint`.
   - `parentnetendpoint`: The endpoint contract address on Parentnet.
   - `subnetendpoint`: The endpoint contract address on Subnet.

### Deploy Subswap

#### Method 1: Using Hardhat Scripts

1. Install Hardhat and dependencies:

```
yarn
```

2. Deploy the Parentnet Treasury contract:

```
npx hardhat run scripts/parentnettreasurydeploy.js --network xdcparentnet
```

3. Deploy the Subnet Treasury contract:

```
npx hardhat run scripts/subnettreasurydeploy.js --network xdcsubnet
```
