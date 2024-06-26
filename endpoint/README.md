# XDC Zero Endpoint

The XDC Zero Endpoint is a foundational cross-chain contract that enables seamless reception and dispatch of data packets across diverse blockchain networks.

## Table of Contents

- [Overview](#overview)
- [Contract Development and Deployment](#contract-development-and-deployment)
- [Additional Commands](#additional-commands)

## Overview

- **Initialization**: Set the `chainId` for the current blockchain.
- **Register Chain**: Introduce a new blockchain, providing its unique identifier, checkpoint contract, and endpoint contract.
- **Send Packet**: Dispatch a data packet to a specified receiving chain.
- **Validate Transaction Proof**:
  - Monitor payload event data via a relayer from the sending chain's Zero Endpoint contract.
  - Deduce the `rid` (receiver's chainId).
  - Execute the `validateTransactionProof` method on the recipient chain, authenticating and archiving the transaction payload.
- **Retrieve Payload**: Applications, identified by `ra`, can easily access the cross-chain payload from the Zero Endpoint contract.

## Workflow

![Alt text](image.png)

## Contract Development and Deployment

### Environment Setup

1. **Install Dependencies**:
   ```shell
   yarn
   ```
2. **Compile & Test**:
   ```shell
   npx hardhat test
   ```

### Contract Configuration

1. **Configuration Files**:

### `endpointconfig.json` - Defining Network Details:

- **`xdcparentnet`**: Contains parameters for deploying the parentnet endpoint.
- **`xdcsubnet`**: Contains parameters for deploying the subnet endpoint.

  - **`endpoint`**: Current address of the chain endpoint.
  - **`registers`**: Parameters for registering specific details.

    - **`csc`**: Checkpoint smart contract address within this chain.
    - **`chainId`**: Identifies the Chain ID of the corresponding chain. (e.g., if set in `xdcparentnet`, the other side refers to the subnet).
    - **`endpoint`**: Address of the endpoint for the register chain.

  - **`applications`**: Parameters for application specific details.
    - **`rid`**: receive chain id
    - **`rua`**: receive chain user application
    - **`sua`**: send chain user application

### `network.config.json` - Specifying Network Details:

- **`xdcparentnet`**: RPC URL for the parentnet.
- **`xdcsubnet`**: RPC URL for the subnet.

2. **Environment Variables**:
   - Set up a `.env` file based on `.env.sample` and provide a valid private key.

### Deployment

To begin deployment, start with the subnet endpoint:

```shell
npx hardhat run scripts/endpointdeploy.js --network xdcsubnet
```

Also start the parentnet endpoint:

```shell
npx hardhat run scripts/endpointdeploy.js --network xdcparentnet
```

Next, configure the registration parameters in the `endpointconfig.json` file for the chain:

```shell
npx hardhat run scripts/registerchain.js --network xdcsubnet
```

Also register on the parentnet:

```shell
npx hardhat run scripts/registerchain.js --network xdcparentnet
```

After setting the application parameters in `endpointconfig.json`, proceed to register the user application (check applications/subswap for an example on deploying application):

```shell
npx hardhat run scripts/registerapplications.js --network xdcsubnet
```

```shell
npx hardhat run scripts/registerapplications.js --network xdcparentnet
```

## Additional Commands

For comprehensive functionalities or deeper insights, refer to the command list below:

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
