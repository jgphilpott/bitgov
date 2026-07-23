# Launch / Deployment checklist

This page documents a safe, minimal process to deploy the compiled contracts in this repository to a live EVM network (for example Ethereum mainnet or a testnet). It focuses on operational safety, reproducibility, and basic post-deploy hygiene.

Use this as a checklist — deploying live value requires caution, audits, and good key management.

## High-level steps

1. Audit & tests
   - Ensure unit, integration and fuzz/property tests pass.
   - Obtain a third-party security audit before issuing real value.
2. Use a testnet first
   - Deploy to a public testnet (Goerli, Sepolia, or the network equivalent) and exercise all flows.
3. Prepare a safe deployer
   - Use a funded, multi-signature wallet (Gnosis Safe) for long-term custody of minted supply or critical admin keys.
   - If you must use an EOA for deployment, keep the private key off-repo and use environment variables or a secure signer service.
4. Configure your tooling
   - Hardhat (or your preferred tool) should be configured with the target RPC and a deployment account supplied by env vars or hardware wallet.
5. Deploy and verify
   - Deploy with a script so the exact transaction sequence is reproducible.
   - Verify the contract source on block explorers (Etherscan) for transparency.
6. Post-deploy: transfer ownership, set roles, document addresses
   - Transfer issuer/owner privileges to a multisig or timelock immediately after deployment.
   - Publish contract addresses and ABI, keep an immutable record (release tag)

## Security checklist (must do before mainnet)

- Tests: full test suite green in CI
- Audit: completed and signed off by a reputable firm
- Multisig: plan for ownership and role custody (Gnosis Safe recommended)
- Timelock: for protocol-level changes where appropriate
- Monitoring: set up transaction and event monitoring and on-chain alerts
- Recovery plan: documented runbooks for compromised keys, accidental mints, etc.

## Hardhat setup (example)

In `hardhat.config.ts` add a network entry (do not check secrets into source):

```ts
// hardhat.config.ts (excerpt)
export default defineConfig({
  // ...existing config...
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL, // Infura/Alchemy or your own node
      chainId: 1,
      accounts: process.env.DEPLOY_PRIVATE_KEY ? [process.env.DEPLOY_PRIVATE_KEY] : [],
    },
  },
});
```

Environment variables (example):

```bash
export MAINNET_RPC_URL="https://eth-mainnet.example"
export DEPLOY_PRIVATE_KEY="0xyourprivatekeyhere"   # DO NOT COMMIT
```

Notes:
- Prefer a hardware wallet or a transient, single-use deploy key funded only with the minimum required gas.
- For multisig-based ownership transfer, deploy with any funded account then immediately transfer ownership to the multisig address.

## Writing a reproducible deploy script

- Keep a single TypeScript/JS script under `scripts/` that performs the full deployment sequence.
- Example (simplified):

```ts
import hre from "hardhat";

export default async function (hre: any) {
  const { ethers } = hre;
  const XCAD = await ethers.getContractFactory("XCAD");
  const xcad = await XCAD.deploy(deployerOwner, initialRecipient, initialSupply);
  await xcad.waitForDeployment();
  console.log("XCAD deployed", xcad.target ?? xcad.address);
}
```

Run with:

```bash
npx hardhat run scripts/deployXcad.ts --network mainnet
```

Or, using `DEPLOY_PRIVATE_KEY` as env var:

```bash
MAINNET_RPC_URL="https://..." DEPLOY_PRIVATE_KEY="0x..." \
  npx hardhat run scripts/deployXcad.ts --network mainnet
```

## Verification on block explorers

- Use Hardhat's Etherscan plugin (or the explorer's UI) to verify the source code so users can read the contract. The verification requires the same compiler settings and constructor parameters.
- Example command (after adding plugin and API key in env):

```bash
npx hardhat verify --network mainnet <DEPLOYED_ADDRESS> "constructorArg1" "constructorArg2"
```

## Post-deploy actions (recommended)

- Transfer ownership to a multisig or timelock account:

```js
await xcad.transferOwnership("0xYourGnosisSafeAddress");
```

- If you used a temporary deploy key, revoke it or transfer remaining funds to secure storage.
- Publish release notes: contract addresses, verified source URLs, expected mint schedule, and audit reports.

## Using an existing private key you mentioned

You can use your existing EOA private key to deploy, but be aware:

- Security: anyone with that key controls the deployer account and any privileged calls until ownership is transferred.
- Funding: ensure the account has enough ETH for gas (estimate generously for mainnet).
- Nonce management: if the account has prior transactions, make sure your deploy script handles nonces correctly or let Hardhat manage nonces via the RPC.

To deploy with that key (example):

```bash
MAINNET_RPC_URL="https://eth-mainnet.alchemyapi.io/v2/XYZ" \
DEPLOY_PRIVATE_KEY="0xe006584988a5209Ad7F0Fb8CfE2dB67e4F152Cd2" \
  npx hardhat run scripts/deployXcad.ts --network mainnet
```

Important: do NOT paste this private key anywhere public. Instead, load it into a secure CI secret or hardware wallet.

## Gas, confirmations, and safety knobs

- Wait for several confirmations (12+) on mainnet before trusting finality when publishing addresses.
- Use `estimateGas()` and add a safety margin on gas limits.
- Consider using `ethers` `getFeeData()` to set gasPrice / maxPriorityFee / maxFee appropriately.

## Emergency and upgrade considerations

- If you expect to upgrade contracts, use a well-audited upgrade pattern (UUPS/transparent) and protect upgrade keys with multisig and timelock.
- If you do not need upgrades, immutable contracts are simpler and safer — but make sure the code is correct and audited first.

## Monitoring & tooling

- Configure monitoring for large mints/transfers (Tenderly, Forta, Blocknative, custom scripts).
- Add on-chain analytics to track circulating supply and unusual activity.

## Final notes

Deploying to mainnet is an operational process as much as a development task. Use the checklist above, prefer multisig custody for any minted supply, and get the contracts audited and verified before public issuance.
