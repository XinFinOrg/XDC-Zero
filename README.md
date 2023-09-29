# XDC Zero Endpoint

The XDC Zero Endpoint serves as a pivotal cross-chain contract, facilitating both the reception and dispatch of data packets across various blockchain networks.

## Overview

- **Initialization**: Assign the current blockchain's `chainId`.
- **Register Chain**: Add a new blockchain, detailing its unique identifier, checkpoint contract, and endpoint contract.
- **Send Packet**: Convey a data packet to the targeted receiving chain.
- **Validate Transaction Proof**:
  - Monitor the payload event data from the relayer linked to the sending chain's Zero Endpoint contract.
  - Extract the `rid` (receiver's chainId).
  - Utilize the `validateTransactionProof` method on the receiving chain to verify and store the transaction payload data.
- **Retrieve Payload**: Applications (addressed by `ra`) can seamlessly extract the cross-chain payload data from the Zero Endpoint contract.

## Contract Development and Deployment

### Environment Setup

1. **Install Dependencies**

   ```shell
   yarn
   ```

2. **Compile & Test**
   ```shell
   npx hardhat test
   ```

### Contract Configuration

1. **Setup Configuration Files**

   Fill out `deployment.config.json`:

   - `chainId`: Define the current endpoint chainId.

   Update your network details in `network.config.json`:

   - `xdcparentnet`: RPC URL for xdcparentnet.
   - `xdcsubnet`: RPC URL for xdcsubnet.

2. **Set Environment Variables**

   Establish a `.env` file using the template from `.env.sample` and input a valid private key.

### Deploying the Contract

1. **Deploy XDC Zero**

   ```shell
   npx hardhat run scripts/xdcZeroDeploy.js --network xdcparentnet
   ```

## Additional Commands

For a deeper dive or other functionalities, refer to the following command list:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx prettier '**/*.{js,json,sol,md}' --check
npx prettier '**/*.{js,json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```
