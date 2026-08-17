# BITGOV Contract

The `BITGOV` contract is a scarce ERC-20 governance token with a Bitcoin-style hard cap. Its full maximum supply is minted once at deployment and can never be increased. Token holders use BITGOV to vote on `XCADGovernor` proposals that control the XCAD stablecoin.

---

## Contract overview

```solidity
contract BITGOV is ERC20, ERC20Burnable, ERC20Capped, ERC20Votes {
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** 8;
    constructor(address initialRecipient) { ... }
    function decimals() public pure override returns (uint8) { ... }
    function _update(address from, address to, uint256 value) internal override(...) { ... }
}
```

| Concept | Meaning |
|---|---|
| `ERC20` | Standard fungible-token behavior |
| `ERC20Burnable` | Tokens can be destroyed, permanently reducing supply |
| `ERC20Capped` | The absolute supply limit is enforced by the contract |
| `ERC20Votes` | On-chain voting checkpoints via `delegate()` / `getVotes()` / `getPastVotes()` |
| `MAX_SUPPLY` | Fixed at `21,000,000 BITGOV`, using 8 decimals |

> **Important:** BITGOV balances do not automatically become voting power.  Each holder must call `delegate(self)` once to activate on-chain checkpointing before they can vote in `XCADGovernor`.

---

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/tokens/BITGOV.ts --network localhost
```

The default Ignition module sends the entire capped supply to the first local account.

---

## Interact via Hardhat console

### 1 — Start a local node

```bash
npx hardhat node
```

### 2 — Deploy the contract

```bash
npx hardhat ignition deploy ignition/modules/tokens/BITGOV.ts --network localhost
```

### 3 — Open the Hardhat console

```bash
npx hardhat console --network localhost
```

### 4 — Connect ethers

```javascript
const { ethers } = await network.connect();
```

### 5 — Attach to the deployed contract

```javascript
const bitgov = await ethers.getContractAt("BITGOV", "DEPLOYED_CONTRACT_ADDRESS");
```

### 6 — Read supply details

```javascript
await bitgov.MAX_SUPPLY();
await bitgov.totalSupply();
```

### 7 — Activate voting power (self-delegate)

```javascript
const [signer] = await ethers.getSigners();
await bitgov.delegate(signer.address);
await bitgov.getVotes(signer.address);  // should now equal balance
```

### 8 — Delegate to another address

```javascript
await bitgov.delegate("DELEGATE_ADDRESS");
```

### 9 — Transfer BITGOV

```javascript
await bitgov.transfer("RECIPIENT_ADDRESS", 100_000_000n);
```

### 10 — Burn BITGOV

```javascript
await bitgov.burn(50_000_000n);
```

---

## Production-readiness notes

`BITGOV` is a scarce, fixed-supply governance token. Before any public issuance consider the following checklist:

- Compile & code hygiene
    - The `_update` override resolves the conflict between `ERC20Capped` (hard cap) and `ERC20Votes` (checkpoint tracking). Both checks run on every transfer.
    - `EIP712("BitGov", "1")` is initialised in the constructor to enable `delegateBySig`.

- Voting participation
    - All holders must call `delegate(self)` once to enable checkpointing. Tokens held without delegation carry no voting weight.
    - Consider airdropping to addresses that will self-delegate, or requiring delegation at the point of initial distribution.

- Custody & governance
    - The entire capped supply is minted at deployment to `initialRecipient` — custody of that account is critical. Use a multisig (e.g. Gnosis Safe) for the recipient address to avoid single-key risk.
    - For protocol changes, use `XCADGovernor` + `XCADTimelockController`.

- Distribution & vesting
    - Implement on-chain or off-chain vesting contracts for team/reserve allocations rather than sending large amounts immediately to single addresses.

- Testing & security
    - Run static analysis and obtain a third-party security audit before any mainnet deployment.
    - Set up monitoring and alerts for large transfers or unusual activity.
