# BallotContract — one-person-one-vote

`BallotContract` implements a simple one-person-one-vote ballot. The chairperson (the account that deploys the contract) registers eligible voters and creates proposals at deployment time. Each registered voter may cast exactly one vote or delegate their vote to another registered voter. Delegations chain correctly — if Alice delegates to Bob, and Bob delegates to Carol, then when Carol votes her tally includes all three weights.

---

## Key concepts

| Term | Meaning |
|---|---|
| **Chairperson** | The deploying account; can register voters and close the ballot |
| **Weight** | Voting power — starts at 1 per voter; grows when delegations flow in |
| **Delegate** | Transfer your entire weight to another registered voter |
| **Proposal index** | Zero-based position in the proposals array (passed to `vote()`) |

---

## Public interface

### Chairperson functions

| Function | Description |
|---|---|
| `registerVoter(address voter)` | Grants voting rights to a single address |
| `registerVoters(address[] voters)` | Batch variant — already-registered addresses are silently skipped |
| `closeVoting()` | Permanently locks the ballot; no further votes or registrations accepted |

### Voter functions

| Function | Description |
|---|---|
| `vote(uint256 proposalIndex)` | Casts your full weight for a proposal |
| `delegate(address to)` | Transfers your weight to another registered voter |

### View functions

| Function | Description |
|---|---|
| `proposalCount()` | Number of proposals in the ballot |
| `winningProposalIndex()` | Index of the leading proposal (ties favour the lower index) |
| `winnerName()` | Name string of the winning proposal |
| `proposals(index)` | Returns `(name, voteCount)` for a proposal |
| `voters(address)` | Returns the full `Voter` struct for an address |

---

## Events

| Event | Emitted when |
|---|---|
| `VoterRegistered(address indexed voter)` | A new voter is registered |
| `VoteCast(address indexed voter, uint256 indexed proposalIndex)` | A vote is cast directly |
| `VoteDelegated(address indexed from, address indexed to)` | A vote is delegated (to is the final, chain-end address) |
| `VotingClosed()` | The ballot is closed |

---

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/BallotContract.ts --network localhost
```

The deployment module creates a ballot with three proposals: `["Alice", "Bob", "Carol"]`. Note the address printed in the output.

---

## Interact via Hardhat console

### 1 — Start a local node (first terminal)

```bash
npx hardhat node
```

Hardhat's built-in node pre-funds 20 test accounts. The first account (`index 0`) is the chairperson and will be used for all admin calls.

### 2 — Deploy (second terminal)

```bash
npx hardhat ignition deploy ignition/modules/BallotContract.ts --network localhost
# Deployed BallotContractModule#BallotContract at 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3 — Open the Hardhat console

```bash
npx hardhat console --network localhost
```

### 4 — Get ethers from the network connection

In Hardhat v3, `ethers` is accessed via the `network` global that the console provides.

```javascript
const { ethers } = await network.connect();
```

### 5 — Attach to the deployed contract and load signers

```javascript
const ballot = await ethers.getContractAt("BallotContract", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Hardhat pre-funds 20 accounts on the local node.
// signers[0] is the chairperson (the account that deployed the contract).
const signers = await ethers.getSigners();
const [chairperson, alice, bob, carol, dave] = signers;
```

### 5 — Register voters

```javascript
// Register a single voter
await ballot.registerVoter(alice.address);

// Or register several at once (more gas-efficient)
await ballot.registerVoters([bob.address, carol.address, dave.address]);
```

### 6 — Inspect the voter records

```javascript
// Returns (registered, voted, delegate, vote, weight)
await ballot.voters(alice.address);
// { registered: true, voted: false, delegate: '0x000...', vote: 0n, weight: 1n }
```

### 7 — Delegate a vote

Bob delegates his vote to Alice. Alice will carry weight 2 when she votes.

```javascript
await ballot.connect(bob).delegate(alice.address);

// Confirm Alice's weight increased
await ballot.voters(alice.address);
// { ..., weight: 2n }
```

### 8 — Cast votes

```javascript
// Alice votes for proposal 0 ("Alice") — her weight 2 counts here
await ballot.connect(alice).vote(0);

// Carol votes for proposal 1 ("Bob")
await ballot.connect(carol).vote(1);

// Dave votes for proposal 2 ("Carol")
await ballot.connect(dave).vote(2);
```

### 9 — Check the running tally

```javascript
// Proposal vote counts
const [name0, count0] = await ballot.proposals(0);
console.log(`${name0}: ${count0}`); // Alice: 2

const [name1, count1] = await ballot.proposals(1);
console.log(`${name1}: ${count1}`); // Bob: 1

// Current leader
await ballot.winnerName(); // 'Alice'
```

### 10 — Close the ballot

```javascript
await ballot.closeVoting();
await ballot.votingClosed(); // true

// Final result
await ballot.winnerName(); // 'Alice'
```

---

## Common revert reasons

| Error | Cause |
|---|---|
| `NotChairperson` | Caller is not the chairperson |
| `AlreadyRegistered` | `registerVoter` was called for an address that is already registered |
| `NotRegistered` | `vote` or `delegate` called by an address that was never registered |
| `AlreadyVoted` | Voter has already cast a ballot or delegated |
| `SelfDelegation` | Voter tried to delegate to themselves |
| `DelegationLoop` | Following the delegation chain would create a cycle |
| `InvalidProposal` | Proposal index is out of bounds |
| `VotingIsClosed` | Mutation called after `closeVoting()` |
