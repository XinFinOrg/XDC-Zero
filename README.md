# XDC Zero Endpoint

The XDC Zero Endpoint is a foundational cross-chain contract designed to both receive and dispatch data packets across different blockchain networks.

## Overview

- **Initialization**: Define the `chainId` of the current blockchain.
- **Register Chain**: Introduce a new blockchain by specifying its unique identifier, checkpoint contract, and endpoint contract.

- **Send Packet**: Transmit a data packet to the designated receiving chain.

- **Validate Transaction Proof**:

  - Listen to the payload event data from the sending chain's Zero Endpoint contract using a relayer.
  - Extract the `rid` (receiver's chainId) from this data.
  - Invoke the `validateTransactionProof` method on the receiving chain to authenticate the transaction and archive the payload data.

- **Retrieve Payload**: Any receiving application (specified by its address `ra`) can effortlessly fetch the cross-chain payload data from the Zero Endpoint contract.

## Contract Building and Testing

### Setting up the Environment

1. **Install Dependencies**
   Install the necessary dependencies using yarn:

   ```shell
   yarn
   ```

2. **Testing**
   Compile and test the contract using the following commands:

   ```shell
   npx hardhat test
   ```

## Contract Setup

1. **Configuration**

   Complete the fields in `deployment.config.json`:

   - `chainId`: set current enpoint chainId

   Configure your network in `network.config.json`:

   - `xdcparentnet`: xdcparentnet RPC URL
   - `xdcsubnet`: xdcsubnet RPC URL

2. **Environment Variables**

   Create a `.env` file containing a valid account private key (refer to `.env.sample` for an example).

## Contract Deployment

Deploy the contract and obtain the deployed contract address as follows:

1. **XDC Zero Deployment**

   ```shell
   npx hardhat run scripts/xdcZeroDeploy.js --network xdcparentnet
   ```

## Additional Commands

For further assistance or to execute other operations, utilize the commands below:

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
