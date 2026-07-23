# XCAD Contract

The `XCAD` contract is a fiat-style ERC-20 token intended to represent a Canadian-dollar-pegged stablecoin. It uses standard token transfers, owner-controlled minting, and holder-controlled burning.

> The peg is **not** enforced by Solidity alone. Keeping `1 XCAD ≈ 1 CAD` requires off-chain reserve management, redemption operations, audits, and governance.

---

## Contract overview

```solidity
contract XCAD is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner, address initialRecipient, uint256 initialSupply) { ... }
    function decimals() public pure override returns (uint8) { ... }
    function mint(address to, uint256 amount) external onlyOwner { ... }
}
```

| Concept | Meaning |
|---|---|
| `ERC20` | Standard fungible-token behavior (balances, transfers, allowances) |
| `ERC20Burnable` | Holders can destroy their own tokens or approved tokens |
| `Ownable` | Only the configured issuer account can mint new supply |
| `decimals() = 6` | Uses fiat-style precision similar to many stablecoins |

---

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/tokens/XCAD.ts --network localhost
```

The default Ignition module assigns ownership to the first local account and mints `1,000,000 XCAD` (with 6 decimals) to that same account.

---

## Interact via Hardhat console

### 1 — Start a local node

```bash
npx hardhat node
```

### 2 — Deploy the contract

```bash
npx hardhat ignition deploy ignition/modules/tokens/XCAD.ts --network localhost
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
const xcad = await ethers.getContractAt("XCAD", "DEPLOYED_CONTRACT_ADDRESS");
```

### 6 — Read token data

```javascript
await xcad.totalSupply();
await xcad.owner();
```

### 7 — Mint more XCAD as the issuer

```javascript
await xcad.mint("RECIPIENT_ADDRESS", 500_000n);
```

### 8 — Burn your own XCAD

```javascript
await xcad.burn(100_000n);
```

---

## Production-readiness notes

`XCAD` is a good minimal prototype for a centrally-issued fiat token, but launching real value requires additional safety, governance, and operational controls. Consider the following before any public issuance:

- Ownership and access
    - Use a multisig or timelock rather than a single EOA for the `owner` role.
    - Prefer `AccessControl` with named roles (`MINTER`, `PAUSER`) when multiple operators are required.

- Safety controls
    - Add `Pausable` so transfers and minting can be halted during emergencies.
    - Add a hard cap (`ERC20Capped`) or governance-controlled cap to limit total supply.
    - Implement mint rate limits (per-call and per-period) to reduce operational risk.

- Governance & custody
    - Require a timelock or governance vote for sensitive actions (large mints, role changes, upgrades).
    - Maintain transparent reserve reporting and on-chain proofs where possible; the peg remains an off-chain responsibility.

- Testing, audit & monitoring
    - Add comprehensive unit, integration, and fuzz/property tests covering minting, burning, cap enforcement, pause behaviour, and role permissions.
    - Run static analysis and obtain a third-party security audit before mainnet issuance.
    - Set up monitoring and alerts for unusual minting or transfer activity.

- UX & integrations
    - Consider EIP-2612 `permit()` for gasless approvals and improved UX.
    - Document off-chain redemption and reserve procedures clearly for auditors and users.
