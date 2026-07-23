# BITGOV Contract

The `BITGOV` contract is a scarce ERC-20 token with a Bitcoin-style hard cap. Its full maximum supply is minted once at deployment and can never be increased.

---

## Contract overview

```solidity
contract BITGOV is ERC20, ERC20Burnable, ERC20Capped {
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** 8;
    constructor(address initialRecipient) { ... }
    function decimals() public pure override returns (uint8) { ... }
}
```

| Concept | Meaning |
|---|---|
| `ERC20` | Standard fungible-token behavior |
| `ERC20Burnable` | Tokens can be destroyed, permanently reducing supply |
| `ERC20Capped` | The absolute supply limit is enforced by the contract |
| `MAX_SUPPLY` | Fixed at `21,000,000 BITGOV`, using 8 decimals |

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

### 7 — Transfer BITGOV

```javascript
await bitgov.transfer("RECIPIENT_ADDRESS", 100_000_000n);
```

### 8 — Burn BITGOV

```javascript
await bitgov.burn(50_000_000n);
```

---

## Production-readiness notes

`BITGOV` is a scarce, fixed-supply token designed to mirror Bitcoin's hard cap. That makes it a good candidate for stores-of-value, but before any public issuance consider the following checklist:

- Compile & code hygiene
    - Remove any non-standard or incorrect overrides (for example `_update` is not an OpenZeppelin ERC-20 hook and will prevent compilation). Use standard hooks such as `_beforeTokenTransfer` if you need custom logic.
    - Prefer explicit `10 ** uint256(decimals())` for computed constants to avoid integer promotion surprises.

- Custody & governance
    - The entire capped supply is minted at deployment to `initialRecipient` — custody of that account is critical. Use a multisig (e.g. Gnosis Safe) for the recipient address to avoid single-key risk.
    - If future protocol changes are possible, require a timelock or governance process for sensitive actions.

- Distribution & vesting
    - Implement on-chain or off-chain vesting contracts for team/reserve allocations rather than sending large amounts immediately to single addresses.

- Testing & security
    - Add unit/integration tests for total supply, decimals, transfer/burn flows, and edge cases.
    - Add fuzz/property tests and static analysis checks.
    - Obtain a third-party security audit before any mainnet deployment.

- Monitoring & ops
    - Set up monitoring and alerts for large transfers or unusual activity.
    - Prepare runbooks for key operational tasks (recovering from accidental transfers, handling burns, etc.).
