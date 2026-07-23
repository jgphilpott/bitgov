# Listing a token on a DEX (Uniswap-style)

This page summarises the practical steps and safety considerations for listing a token like `XCAD` or `BITGOV` on an automated market maker (AMM) DEX such as Uniswap, SushiSwap, or PancakeSwap.

Treat this as an operational checklist — do everything on a testnet first and avoid using privileged keys directly for liquidity operations.

## Quick checklist (preparation)

- Verify and publish the token source (Etherscan) and ABI.
- Ensure decimals and ERC-20 behaviour are standard (no fees-on-transfer unless expected by integrators).
- Decide the pair asset (ETH, WETH, stablecoin like USDC) and initial price.
- Use a multisig/Gnosis Safe to hold LP tokens and to perform liquidity provisioning if possible.
- Test the full flow on a public testnet (Sepolia/Holesky) and simulate buys/sells.

## Create the pool (Uniswap v2 / v3 concepts)

- v2-style AMMs: create a pair contract for Token<>Token (or Token<>WETH) and call `router.addLiquidity` / `router.addLiquidityETH`.
- v3-style AMMs: create a pool for Token<>Token with fee tier (e.g., 0.05%/0.3%/1%) and deposit an initial concentrated liquidity range via `NonfungiblePositionManager`.

Key points:
- The first liquidity provider sets the initial price. Choose the token amounts carefully to represent the desired market rate.
- Adding liquidity is an on-chain transaction that requires approving the Router/PositionManager to spend tokens.

## Minimal Uniswap-v2 flow (ethers.js example)

1) Approve the router to spend your token:

```js
const router = await ethers.getContractAt('IUniswapV2Router02', ROUTER_ADDRESS);
await token.connect(deployer).approve(router.address, amountA);
```

2) Add liquidity (token <> WETH example):

```js
await router.addLiquidityETH(
  token.address,
  tokenAmount,
  minToken,
  minEth,
  recipientAddress, // usually a multisig
  deadline, // e.g. Math.floor(Date.now()/1000) + 60*10
  { value: ethAmount }
);
```

Notes:
- `minToken` / `minEth` protect against frontrunning and large price slippage.
- `recipientAddress` should receive the LP tokens (use a multisig address, not the deployer key).

## Uniswap-v3 notes

- v3 is more complex: you must choose a fee tier and an initial price range. Use the NonfungiblePositionManager to mint a position.
- Concentrated liquidity reduces capital requirements but requires active management or a wider range.

## Price, slippage and initial liquidity sizing

- Decide the initial market price (token per ETH or stablecoin). For stablecoins, common pairing is token/USDC.
- Provide sufficient depth to allow meaningful trades without huge price impact (simulate using the AMM's constant-product equation).
- Set conservative slippage tolerances in your add-liquidity and first-swap transactions.

## Impermanent loss, LP custody & farming

- LP providers are exposed to impermanent loss: document this risk for treasury and contributors.
- Keep LP tokens in a secure multisig. If you intend to run incentives, consider separate incentive contracts but audit carefully.

## Security and regulatory considerations

- Adding liquidity means funds are on-chain and visible. Use multisigs and timelocks for operational safety.
- Consider whether the token or pair may trigger compliance requirements in your jurisdictions (stablecoins especially require regulatory review).

## Post-listing actions

- Verify the pool exists on the block explorer and add the pool/pair addresses to your project docs.
- Submit token metadata (logo, decimals, website) to aggregators (CoinGecko/CoinMarketCap) and DEX UIs if needed.
- Announce the listing and document the exact pair address, initial liquidity, and the multisig custody details.

## Test ideas (before mainnet)

- On testnet, create the same pair and run scripted buys/sells to observe price behaviour and slippage.
- Test LP withdrawal and large-swap edge cases.

## References & useful addresses

- Uniswap v2 Router / Factory docs: https://uniswap.org/docs/v2/
- Uniswap v3 docs: https://docs.uniswap.org/
- Example router addresses are network-dependent; confirm the correct router for your chain before calling any ops.

If you'd like, I can:
- Add an example `scripts/addLiquidity.ts` for Uniswap-v2/v3 (testnet-first) that approves, adds liquidity, and transfers LP tokens to a multisig.
- Add a small note to `docs/LAUNCH.md` linking to this DEX doc.
