# XDC ZERO: Cross-Chain System 

Elevate blockchain interoperability with the XDC ZERO system, ensuring seamless data transmission and validation across diverse chains.

## Table of Contents

- [Core](/core/)
- [Frontend](/frontend/)
- [Relayer](/relayer/)

## Key Components

### Oracle

The Oracle is the backbone of our architecture, facilitating the secure transfer of vital data, especially block headers, between source and target blockchains. Through the utilization of CSC contracts, the system not only ensures robust data transmission but also preserves essential block header information on the target blockchain. This dual-functionality upholds the integrity and consistency of data across chains.

### Relayer

Our Relayer service is the bridge ensuring transactional accuracy. Its primary responsibility is to fetch payload data from the source chain's Endpoint contract and forward it to the target chain's Endpoint contract. Through this, the XDC ZERO system guarantees the accurate and secure transfer of transaction data, enhancing the efficiency of cross-chain interactions.

![System Architecture](image.png)