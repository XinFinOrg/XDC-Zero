# Subswap Contract Deployment Guide

This guide provides the steps to check and configure necessary values in the `deploy.config.json` file, and then deploy Subswap and the Subnet Token using Hardhat scripts.


## Configuration: `deploy.config.json`

1. **Open the `deploy.config.json` File**
   - Verify the values for `parentnetendpoint` and `subnetendpoint`.
   - `parentnetendpoint`: The endpoint contract address on Parentnet.
   - `subnetendpoint`: The endpoint contract address on Subnet.
   - `subnettoken`:
     - `name`: The name of the token.
     - `symbol`: The symbol of the token.
     - `initSupply`: The initial supply of the token.

## Deploying Subswap

### Method 1: Using Hardhat Scripts

1. **Install Hardhat and Dependencies**

   ```bash
   yarn
   ```

2. **Deploy the Parentnet Treasury Contract**

   ```bash
   npx hardhat run scripts/parentnettreasurydeploy.js --network xdcparentnet
   ```

3. **Deploy the Subnet Treasury Contract**

   ```bash
   npx hardhat run scripts/subnettreasurydeploy.js --network xdcsubnet
   ```

## Deploying the Subnet Token

```bash
npx hardhat run scripts/simpletokendeploy.js --network xdcsubnet
```

