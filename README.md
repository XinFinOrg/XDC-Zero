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
