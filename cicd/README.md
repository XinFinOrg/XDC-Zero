# XDC ZERO CICD

## Deploy with Docker

### 1. Deploy XDC Zero

#### Step 1: Create a `.env` File

Based on the provided `.env.example`, create your own `.env` file with the following details:

- **`PARENTNET_URL`**: RPC URL for the parentnet endpoint.
- **`SUBNET_URL`**: RPC URL for the subnet.
- **`SUBNET_PK`**: Private key for the deploy subnet XDC Zero wallet.
- **`CSC`**: Checkpoint smart contract address within the subnet chain (deployed to parentnet).
- **`REVERSE_CSC`**: Checkpoint smart contract address within the parentnet chain (deployed to subnet).

#### Step 2: Deploy Endpoints and Register Chain

Run the following command to deploy the endpoints and register the chain:

```sh
docker run --env-file .env xinfinorg/xdc-zero:latest endpointandregisterchain.js
```

Add the output to your `.env` file:

- **`SUBNET_ZERO_CONTRACT`**: XDC ZERO contract address for subnet.
- **`PARENTNET_ZERO_CONTRACT`**: XDC ZERO contract address for parentnet.

### 2. Deploy Application

There are some application example , you can feel free to deploy

- [Sample](../applications/sample/)

- [Subswap](../applications/subswap/)

(Optional)Here Subswap is our default provided application, you can also deploy your own custom app.

```sh
docker run --env-file .env xinfinorg/xdc-zero:latest subswap.js
```

### 3. Register Application to XDC Zero

Add the user application contract address to your `.env` file:

- **`SUBNET_APP`**: Subnet user application address.
- **`PARENTNET_APP`**: Parentnet user application address.

Run the following command:

```sh
docker run --env-file .env xinfinorg/xdc-zero:latest applicationregister.js
```

---

## Deploy with Repository

### Step 1: Install Packages

Run the following commands to install the necessary packages:

```sh
cd ../endpoint
yarn
cd ../applications/subswap/contract
yarn
cd cicd
yarn
```

### Step 2: Create a `.env` File to `cicd/mount`

Based on the provided `.env.example`, create your own `.env` file with the following details:

- **`PARENTNET_URL`**: RPC URL for the parentnet endpoint.
- **`SUBNET_URL`**: RPC URL for the subnet.
- **`SUBNET_PK`**: Private key for the deploy subnet XDC Zero wallet.
- **`CSC`**: Checkpoint smart contract address within the subnet chain (deployed to parentnet).
- **`REVERSE_CSC`**: Checkpoint smart contract address within the parentnet chain (deployed to subnet).

### Step 3: Deploy Endpoint and Register Chain

Navigate to the `cicd` directory and run the following command:

```sh
cd cicd
node endpointandregisterchain.js
```

Add the output to your `.env` file:

- **`SUBNET_ZERO_CONTRACT`**: XDC ZERO contract address for subnet.
- **`PARENTNET_ZERO_CONTRACT`**: XDC ZERO contract address for parentnet.

### Step 4: Deploy Application

There are some application example , you can feel free to deploy

- [Sample](../applications/sample/)

- [Subswap](../applications/subswap/)

(Optional)Here Subswap is our default provided application, you can also deploy your own custom app.

```sh
node subswap.js
```

### Step 5: Register Applicationc

Add the user application contract address to `cicd/mount/.env`:

- **`SUBNET_APP`**: Subnet user application address.
- **`PARENTNET_APP`**: Parentnet user application address.

Run the following command:

```sh
node applicationregister.js
```
