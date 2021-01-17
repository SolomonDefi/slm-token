# Solomon Token (SLM)

The Solomon token is an Ethereum ERC20 compliant token. The purpose is to facilitate the operation of the Solomon DeFi plugin and ecosystem.

### Definitions
- **Solomon Token** - Ethereum ERC20 token. Abbreviated SLM.
- **Wallet** - An Ethereum address/account
- **solc** The Solidity smart contract compiler

### Description

SLM is an ERC20 token with standard extensions for updating a wallet's allowance, as well as minting and burning functionality. It is based
on OpenZeppelin's open source ERC20 implementation found here: https://github.com/OpenZeppelin/openzeppelin-contracts

The main additional feature is a global lock that the owner can use to stop and start trading. It disables all transfer related functions,
including `transfer`, `transferFrom`, `approve`, `increaseAllowance`, and `decreaseAllowance`. This is intended for use during
initialization and presale prior to exchange listings, and as an emergency halt if any critical issues come up during operation. In order to
facilitate a presale, specific addresses (e.g. the presale contract address) may be exempted from the lock.

Some minor changes were made to the Open Zeppelin ERC20 implementation in order to achieve compatibility with [solc version 0.8.0](https://github.com/ethereum/solidity/releases/tag/v0.8.0).

### Features
- ERC20 token functionality: https://eips.ethereum.org/EIPS/eip-20
- `increaseApproval` and `decreaseApproval` to avoid multiple withdrawal attack
- Mint and burn operations
- Single use initialization function
- Global trade lock with exceptions for specific addresses
- Solidity compiler version 0.8.0

### Token Allocations

SLM is initialized with a 100M total supply according to the following token distribution:

- 50% - Presale
- 25% - Development
- 15% - Rewards and promotions
- 10% - Team
