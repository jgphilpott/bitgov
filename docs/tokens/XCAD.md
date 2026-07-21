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
