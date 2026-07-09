# TokenWeightedVote — token-weighted voting

`TokenWeightedVote` implements governance where influence is proportional to an address's allocated token balance — one token equals one vote. The owner allocates governance tokens to eligible voters before or during the voting period. Each token-holder may freely split their balance across as many proposals as they like by calling `vote()` multiple times.

---

## Key concepts

| Term | Meaning |
|---|---|
| **Owner** | The deploying account; can allocate tokens and close the ballot |
| **Balance** | Total governance tokens allocated to a voter by the owner |
| **Spent** | Tokens already committed to proposals |
| **Remaining** | `balance - spent` — tokens still available to vote with |
| **Split vote** | Calling `vote()` multiple times to spread tokens across proposals |

---

## Public interface

### Owner functions

| Function | Description |
|---|---|
| `allocateTokens(address voter, uint256 amount)` | Adds `amount` tokens to a voter's balance (additive; can be called multiple times) |
| `closeVoting()` | Permanently locks the ballot; no further allocations or votes accepted |

### Voter functions

| Function | Description |
|---|---|
| `vote(uint256 proposalIndex, uint256 weight)` | Commits `weight` tokens to a proposal; may be called multiple times with different proposals |

### View functions

| Function | Description |
|---|---|
| `remainingTokens(address voter)` | Unspent token balance available for voting |
| `proposalCount()` | Number of proposals in the ballot |
| `winningProposalIndex()` | Index of the leading proposal (ties favour the lower index) |
| `winnerName()` | Name string of the winning proposal |
| `proposals(index)` | Returns `(name, voteCount)` for a proposal |
| `voters(address)` | Returns `(balance, spent)` for an address |
| `totalSupply` | Running total of all allocated governance tokens |

---

## Events

| Event | Emitted when |
|---|---|
| `TokensAllocated(address indexed voter, uint256 amount)` | Tokens are allocated to a voter |
| `VoteCast(address indexed voter, uint256 indexed proposalIndex, uint256 weight)` | Tokens are committed to a proposal |
| `VotingClosed()` | The ballot is closed |

---

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/TokenWeightedVote.ts --network localhost
```

The deployment module creates a ballot with three proposals: `["Proposal A", "Proposal B", "Proposal C"]`. Note the address printed in the output.

---

## Interact via Hardhat console

### 1 — Start a local node (first terminal)

```bash
npx hardhat node
```

Hardhat's built-in node pre-funds 20 test accounts. The first account (`index 0`) is the owner and will be used for all admin calls.

### 2 — Deploy (second terminal)

```bash
npx hardhat ignition deploy ignition/modules/TokenWeightedVote.ts --network localhost
# Deployed TokenWeightedVoteModule#TokenWeightedVote at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### 3 — Open the Hardhat console

```bash
npx hardhat console --network localhost
```

### 4 — Import ethers and load signers

Hardhat v3 no longer injects globals into the console automatically.

```javascript
const { ethers } = await import("hardhat");
```

### 5 — Attach to the deployed contract and load signers

```javascript
const twv = await ethers.getContractAt("TokenWeightedVote", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

// Hardhat pre-funds 20 accounts on the local node.
// signers[0] is the owner (the account that deployed the contract).
const signers = await ethers.getSigners();
const [owner, alice, bob, carol] = signers;
```

### 5 — Allocate governance tokens

```javascript
await twv.allocateTokens(alice.address, 100);
await twv.allocateTokens(bob.address,   50);
await twv.allocateTokens(carol.address, 200);

// Check total supply
await twv.totalSupply(); // 350n

// Check an individual balance
await twv.voters(alice.address);
// { balance: 100n, spent: 0n }
```

### 6 — Cast votes (single proposal)

```javascript
// Bob puts all 50 tokens on Proposal A (index 0)
await twv.connect(bob).vote(0, 50);
```

### 7 — Cast a split vote (multiple proposals)

```javascript
// Alice spreads her 100 tokens across two proposals
await twv.connect(alice).vote(0, 60); // 60 tokens → Proposal A
await twv.connect(alice).vote(1, 40); // 40 tokens → Proposal B

// Alice's remaining balance is now 0
await twv.remainingTokens(alice.address); // 0n
```

### 8 — Check the running tally

```javascript
// Proposal vote counts
const [nameA, countA] = await twv.proposals(0);
console.log(`${nameA}: ${countA}`); // Proposal A: 110

const [nameB, countB] = await twv.proposals(1);
console.log(`${nameB}: ${countB}`); // Proposal B: 40

// Current leader
await twv.winnerName(); // 'Proposal A'
```

### 9 — Top up a voter's balance mid-poll

`allocateTokens` is additive, so you can call it again to give a voter more tokens while voting is still open.

```javascript
await twv.allocateTokens(carol.address, 100); // carol now has 300 total
await twv.voters(carol.address);
// { balance: 300n, spent: 0n }

// Carol votes for Proposal C with all 300 tokens
await twv.connect(carol).vote(2, 300);
```

### 10 — Close the ballot

```javascript
await twv.closeVoting();
await twv.votingClosed(); // true

// Final result
await twv.winnerName(); // 'Proposal C'
await twv.winningProposalIndex(); // 2n
```

---

## Common revert reasons

| Error | Cause |
|---|---|
| `NotOwner` | Caller is not the owner |
| `ZeroWeight` | `vote()` called with `weight = 0` |
| `InsufficientTokens` | Requested weight exceeds the voter's remaining token balance |
| `InvalidProposal` | Proposal index is out of bounds |
| `VotingIsClosed` | Mutation called after `closeVoting()` |
