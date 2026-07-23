# XCAD Contract

The `XCAD` contract is a DAO-governed ERC-20 token intended to represent a Canadian-dollar-pegged stablecoin. The owner of the contract is the `XCADTimelockController`, meaning all sensitive parameter changes require a successful `XCADGovernor` vote before they can take effect.

> The peg is **not** enforced by Solidity alone. Keeping `1 XCAD ≈ 1 CAD` requires off-chain reserve management, redemption operations, audits, and governance.

---

## Contract overview

```solidity
contract XCAD is ERC20, ERC20Burnable, Ownable, Pausable {
    constructor(
        address initialOwner,      // XCADTimelockController in production
        address initialRecipient,
        uint256 initialSupply,
        uint256 initialSupplyCap   // 0 = uncapped
    ) { ... }

    // DAO-gated (onlyOwner = timelock)
    function mint(address to, uint256 amount) external onlyOwner { ... }
    function setSupplyCap(uint256 newCap) external onlyOwner { ... }
    function setDecimals(uint8 newDecimals) external onlyOwner { ... }
    function pause() external onlyOwner { ... }
    function unpause() external onlyOwner { ... }
}
```

| Concept | Meaning |
|---|---|
| `ERC20` | Standard fungible-token behavior (balances, transfers, allowances) |
| `ERC20Burnable` | Holders can destroy their own tokens or approved tokens |
| `Ownable` | The `XCADTimelockController` is the owner; only the DAO can mint / change parameters |
| `Pausable` | Emergency circuit-breaker: halts all transfers, mints, and burns |
| `supplyCap` | Governance-controlled max supply; `0` means uncapped |
| `decimals()` | Mutable display precision (cosmetic only — see warning below) |

> **Decimals warning:** `setDecimals()` changes how UIs render balances but does **not** rescale any stored amounts. Use only if you have a deliberate reason (e.g. aligning with a new peg standard) and communicate the change clearly to users and integrators beforehand.

---

## Deploy

Prefer the full governance deployment which wires all contracts together:

```bash
npx hardhat ignition deploy ignition/modules/governance/XCADGovernor.ts --network localhost
```

For a standalone XCAD deployment (e.g. staging, with a single EOA as owner):

```bash
npx hardhat ignition deploy ignition/modules/tokens/XCAD.ts --network localhost
```

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
await xcad.supplyCap();   // 0 = uncapped
await xcad.decimals();
await xcad.owner();       // should be the timelock in production
```

### 7 — Mint more XCAD (requires owner / DAO approval in production)

```javascript
await xcad.mint("RECIPIENT_ADDRESS", 500_000n);
```

### 8 — Update the supply cap via governance

See `docs/governance/XCADGovernor.md` for the full proposal lifecycle. Example calldata:

```javascript
const iface    = new ethers.Interface(["function setSupplyCap(uint256)"]);
const calldata = iface.encodeFunctionData("setSupplyCap", [2_000_000n * 10n ** 6n]);
```

### 9 — Burn your own XCAD

```javascript
await xcad.burn(100_000n);
```

---

## Production-readiness notes

`XCAD` is a governance-controlled stablecoin prototype. Before any public issuance consider the following:

- Ownership and access
    - The `initialOwner` should be an `XCADTimelockController` governed by `XCADGovernor`. Never deploy with a single EOA as owner in production.
    - After deployment, verify `xcad.owner()` equals the timelock address.

- Supply cap
    - Set `initialSupplyCap` to a conservative upper bound for the initial launch. The DAO can raise it later via governance.
    - A cap of `0` (uncapped) should only be used for testing or if the supply model is deliberately unbounded.

- Pause mechanism
    - The pause circuit-breaker halts ALL token operations (transfers, mints, burns). Unpausing also requires a governance vote (owner = timelock).
    - For faster emergency response, consider assigning a `GUARDIAN` role (e.g. a multisig) that can pause without a vote, but require governance to unpause.

- Governance & custody
    - Require a governance vote for large mints, cap changes, and upgrades.
    - Maintain transparent reserve reporting and on-chain proofs where possible.

- Testing, audit & monitoring
    - Run static analysis and obtain a third-party security audit before mainnet issuance.
    - Set up monitoring and alerts for unusual minting or transfer activity.

- UX & integrations
    - Consider EIP-2612 `permit()` for gasless approvals and improved UX.
    - Document off-chain redemption and reserve procedures clearly for auditors and users.
