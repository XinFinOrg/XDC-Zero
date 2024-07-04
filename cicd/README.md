# Deploy with Docker
## Deploy XDC Zero
1. create a .env like the following example
```
PARENTNET=devnet
SUBNET_URL=
SUBNET_PK=0x1111111111111111111111111111111111111111111111111111111111111111
PARENTNET_PK=0x2222222222222222222222222222222222222222222222222222222222222222
CSC=0x3333333333333333333333333333333333333333
REVERSE_CSC=0x4444444444444444444444444444444444444444
```

2. Deploy XDC-Zero endpoints and register chain
```
docker run --env-file .env xinfinorg/xdc-zero:latest endpointandregisterchain.js
```

- add the output to .env
```
SUBNET_ZERO_CONTRACT=0x5555555555555555555555555555555555555555
PARENTNET_ZERO_CONTRACT=0x6666666666666666666666666666666666666666
```

## Deploy Subswap
3. Deploy Subswap
```
docker run --env-file .env xinfinorg/xdc-zero:latest subswap.js
```
- add the output to .env
```
SUBNET_APP=0x7777777777777777777777777777777777777777
PARENTNET_APP=0x8888888888888888888888888888888888888888
```


## Register Application to XDC Zero
4. Register Subswap to XDC-Zero
```
docker run --env-file .env xinfinorg/xdc-zero:latest applicationregister.js
```

<br/>
<br/>

# Deploy using this repository

1. Install packages
```
cd ../endpoint
yarn
cd ../applications/subswap/contract
yarn
cd cicd
yarn
```

2. Configure .env at cicd/mount/.env
```
PARENTNET=devnet
SUBNET_URL=
SUBNET_PK=0x1111111111111111111111111111111111111111111111111111111111111111
PARENTNET_PK=0x2222222222222222222222222222222222222222222222222222222222222222
CSC=0x3333333333333333333333333333333333333333
REVERSE_CSC=0x4444444444444444444444444444444444444444
```

3. Deploy endpoint and register chain
```
cd cicd
node endpointandregisterchain.js
```

4. Deploy Subswap
```
node subswap.js
```
- add the output to cicd/mount/.env
```
SUBNET_APP=0x7777777777777777777777777777777777777777
PARENTNET_APP=0x8888888888888888888888888888888888888888
```


5. Register Application
```
node applicationregister.js
```
