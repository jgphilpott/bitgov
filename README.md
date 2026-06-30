<p align="center">
  <img width="150" height="150" src="https://github.com/jgphilpott/bitgov/blob/master/icon.png">
</p>

# BitGov

BitGov is an exploration of **decentralized digital democracy** using Solidity smart contracts on the Ethereum blockchain.

> **Note:** The original Python implementation has been preserved on the [`copilot/preserve-old-python-code`](https://github.com/jgphilpott/bitgov/tree/copilot/preserve-old-python-code) branch.

---

## What is Solidity?

[Solidity](https://soliditylang.org) is a statically-typed, object-oriented programming language designed specifically for writing **smart contracts** — self-executing programs that live on the Ethereum blockchain.

Key properties:

- **Deterministic** — the same inputs always produce the same outputs, on every node worldwide.
- **Trustless** — no central authority controls execution; the EVM (Ethereum Virtual Machine) does.
- **Immutable** — once deployed, contract code cannot be changed (unless explicitly designed to be upgradeable).
- **Transparent** — all contract code and state is publicly verifiable on-chain.

These properties make Solidity a natural fit for governance applications where trust, transparency, and censorship-resistance matter.

---

## Hello World

The classic starting point. The `HelloWorld` contract stores a greeting string on-chain and exposes functions to read and update it.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HelloWorld {
    string private _message;

    event MessageChanged(string newMessage);

    constructor(string memory initialMessage) {
        _message = initialMessage;
    }

    function getMessage() external view returns (string memory) {
        return _message;
    }

    function setMessage(string memory newMessage) external {
        _message = newMessage;
        emit MessageChanged(newMessage);
    }
}
```

A few things to notice:

| Concept | Meaning |
|---|---|
| `pragma solidity ^0.8.28` | Specifies the minimum compiler version |
| `string private _message` | A state variable — stored permanently on-chain |
| `constructor(...)` | Runs once at deployment |
| `external view` | Read-only function; no gas cost when called off-chain |
| `emit MessageChanged(...)` | Fires an event — cheap, indexable log entries on the blockchain |

---

## Project Setup

This project uses [Hardhat](https://hardhat.org) — the most widely used Ethereum development environment.

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- npm ≥ 9

### Install dependencies

```bash
npm install
```

### Compile contracts

```bash
npm run compile
```

### Run tests

```bash
npm test
```

### Deploy locally (Hardhat network)

```bash
npx hardhat ignition deploy ignition/modules/HelloWorld.ts
```

---

## Project Structure

```
bitgov/
├── contracts/          # Solidity smart contracts
│   └── HelloWorld.sol
├── ignition/
│   └── modules/        # Hardhat Ignition deployment modules
│       └── HelloWorld.ts
├── test/               # TypeScript test suite (Mocha + Ethers.js)
│   └── HelloWorld.ts
├── hardhat.config.ts   # Hardhat configuration
└── tsconfig.json       # TypeScript configuration
```

---

## Next Steps

From this foundation, BitGov will grow to explore on-chain governance primitives:

- **Voting** — token-weighted or one-person-one-vote ballot contracts
- **Proposals** — on-chain creation, discussion, and execution of governance proposals
- **Identity** — decentralized citizen identity using [OpenZeppelin](https://openzeppelin.com/contracts/)
- **Treasury** — collectively controlled funds released by vote outcome

---

## License

[MIT](LICENSE)
