<p align="center">
  <img width="150" height="150" src="https://github.com/jgphilpott/bitgov/blob/master/icon.png">
</p>

# BitGov

BitGov is an exploration of **decentralized digital democracy** using Solidity smart contracts on the Ethereum blockchain.

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

## Contracts

| Contract | Description | Docs |
|---|---|---|
| [`HelloWorld`](contracts/intro/HelloWorld.sol) | Classic starter — stores and updates a greeting string on-chain | [docs/intro/HelloWorld.md](docs/intro/HelloWorld.md) |
| [`BallotContract`](contracts/voting/BallotContract.sol) | One-person-one-vote ballot with delegation support | [docs/voting/BallotContract.md](docs/voting/BallotContract.md) |
| [`TokenWeightedVote`](contracts/voting/TokenWeightedVote.sol) | Token-weighted voting with partial/split vote support | [docs/voting/TokenWeightedVote.md](docs/voting/TokenWeightedVote.md) |
| [`XCAD`](contracts/tokens/XCAD.sol) | Centrally issued Canadian-dollar stablecoin prototype with owner-controlled minting | [docs/tokens/XCAD.md](docs/tokens/XCAD.md) |
| [`BITGOV`](contracts/tokens/BITGOV.sol) | Scarce ERC-20 token with a Bitcoin-style hard cap and fixed deployment supply | [docs/tokens/BITGOV.md](docs/tokens/BITGOV.md) |

Each contract page includes a full interface reference, event list, step-by-step deployment instructions, and an interactive Hardhat console walkthrough.

---

## Project Setup

This project uses [Hardhat](https://hardhat.org) — the most widely used Ethereum development environment.

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- npm >= 9

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
# Start a local Hardhat node (first terminal)
npx hardhat node

# Deploy a contract (second terminal)
npx hardhat ignition deploy ignition/modules/voting/BallotContract.ts --network localhost
npx hardhat ignition deploy ignition/modules/voting/TokenWeightedVote.ts --network localhost
npx hardhat ignition deploy ignition/modules/intro/HelloWorld.ts --network localhost
npx hardhat ignition deploy ignition/modules/tokens/XCAD.ts --network localhost
npx hardhat ignition deploy ignition/modules/tokens/BITGOV.ts --network localhost
```

---

## Next Steps

From this foundation, BitGov will grow to explore on-chain governance primitives:

- **Proposals** — on-chain creation, discussion, and execution of governance proposals
- **Identity** — decentralized citizen identity using [OpenZeppelin](https://openzeppelin.com/contracts/)
- **Treasury** — collectively controlled funds released by vote outcome

---

## License

[MIT](LICENSE)
