# XCADGovernor

The `XCADGovernor` system is a fully on-chain DAO that controls sensitive parameters of the `XCAD` stablecoin. BITGOV token holders vote on proposals; passed proposals are routed through a time-locked executor before they take effect on-chain.

---

## Contract overview

```
BITGOV (ERC20Votes)
   └── voting power source

XCADTimelockController (TimelockController)
   └── mandatory delay before executing any approved action

XCADGovernor (Governor stack)
   ├── GovernorSettings          — voting delay, period, proposal threshold
   ├── GovernorCountingSimple    — For / Against / Abstain tallying
   ├── GovernorVotes             — reads BITGOV checkpointed balances
   ├── GovernorVotesQuorumFraction — quorum as % of total supply
   └── GovernorTimelockControl   — queues passed proposals in the timelock
```

### Governable XCAD parameters

| Function | Effect |
|---|---|
| `setSupplyCap(uint256)` | Raise, lower, or remove (0 = uncapped) the maximum mintable supply |
| `setDecimals(uint8)` | Change the display decimals (cosmetic — does not rescale balances) |
| `pause()` | Emergency circuit-breaker: halt all transfers, mints, and burns |
| `unpause()` | Restore normal operation |
| `mint(address, uint256)` | Mint new XCAD (owner = timelock, so requires a governance vote) |

---

## Proposal lifecycle

```
1. propose()   — any BITGOV holder meeting proposalThreshold submits a proposal
2. (wait votingDelay blocks)
3. castVote()  — BITGOV holders vote For / Against / Abstain
4. (wait votingPeriod blocks)
5. queue()     — passed proposal is queued in the timelock
6. (wait timelock minDelay seconds)
7. execute()   — timelock applies the change on-chain
```

---

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/governance/XCADGovernor.ts --network localhost
```

The module deploys BITGOV, XCADTimelockController, XCADGovernor, and XCAD in the correct order, and grants the governor the required roles on the timelock.

> **Post-deployment step (production only):** Renounce the deployer's `DEFAULT_ADMIN_ROLE` on the timelock so that role management is fully controlled by governance:
>
> ```javascript
> await timelock.renounceRole(await timelock.DEFAULT_ADMIN_ROLE(), deployer.address);
> ```

---

## Interact via Hardhat console

### 1 — Start a local node

```bash
npx hardhat node
```

### 2 — Deploy the governance system

```bash
npx hardhat ignition deploy ignition/modules/governance/XCADGovernor.ts --network localhost
```

### 3 — Open the Hardhat console

```bash
npx hardhat console --network localhost
```

### 4 — Connect ethers

```javascript
const { ethers } = await network.connect();
```

### 5 — Attach to deployed contracts

```javascript
const bitgov    = await ethers.getContractAt("BITGOV",                  "BITGOV_ADDRESS");
const timelock  = await ethers.getContractAt("XCADTimelockController",  "TIMELOCK_ADDRESS");
const governor  = await ethers.getContractAt("XCADGovernor",            "GOVERNOR_ADDRESS");
const xcad      = await ethers.getContractAt("XCAD",                    "XCAD_ADDRESS");
```

### 6 — Self-delegate to activate voting power

```javascript
const [signer] = await ethers.getSigners();
await bitgov.delegate(signer.address);
```

### 7 — Create a proposal to raise the supply cap

```javascript
const iface    = new ethers.Interface(["function setSupplyCap(uint256)"]);
const calldata = iface.encodeFunctionData("setSupplyCap", [2_000_000n * 10n ** 6n]);
const desc     = "Raise XCAD supply cap to 2M";

await governor.propose([xcad.target], [0n], [calldata], desc);
```

### 8 — Vote on the proposal

```javascript
const proposalId = await governor.hashProposal(
  [xcad.target], [0n], [calldata], ethers.id(desc)
);
await governor.castVote(proposalId, 1n); // 1 = For
```

### 9 — Queue the passed proposal

```javascript
await governor.queue([xcad.target], [0n], [calldata], ethers.id(desc));
```

### 10 — Execute after the timelock delay

```javascript
await governor.execute([xcad.target], [0n], [calldata], ethers.id(desc));
```

---

## Production-readiness notes

- **Self-delegate:** BITGOV balances do not automatically translate to voting power. Every holder must call `bitgov.delegate(address)` once (to themselves or another trusted address) to activate checkpointing.
- **Timelock delay:** The recommended `minDelay` is 172 800 seconds (2 days) for production deployments, giving holders time to react before a proposal takes effect.
- **Quorum:** The default `quorumNumerator` is 4 %. Adjust before deployment based on the expected token distribution.
- **Proposal threshold:** Setting `proposalThreshold = 0` allows any BITGOV holder to propose. Raise it to prevent spam on mainnet.
- **Renounce admin:** After the initial role setup, the deployer should renounce `DEFAULT_ADMIN_ROLE` on the timelock so no single address can bypass governance.
- **Decimals warning:** `setDecimals` is cosmetic — it changes how UIs display balances but does not rescale stored amounts. Use with care on a live token.
