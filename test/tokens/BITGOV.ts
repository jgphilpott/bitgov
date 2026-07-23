import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("BITGOV", function () {
  const maxSupply = 21_000_000n * 10n ** 8n;

  it("Should mint the full capped supply at deployment", async function () {
    const [owner] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    expect(await bitgov.name()).to.equal("BitGov");
    expect(await bitgov.symbol()).to.equal("BITGOV");
    expect(await bitgov.decimals()).to.equal(8n);
    expect(await bitgov.MAX_SUPPLY()).to.equal(maxSupply);
    expect(await bitgov.totalSupply()).to.equal(maxSupply);
    expect(await bitgov.balanceOf(owner.address)).to.equal(maxSupply);
  });

  it("Should permanently reduce supply when tokens are burned", async function () {
    const [owner] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    await bitgov.burn(50_000_000n);

    expect(await bitgov.totalSupply()).to.equal(maxSupply - 50_000_000n);
    expect(await bitgov.balanceOf(owner.address)).to.equal(maxSupply - 50_000_000n);
  });

  it("Should allow standard transfers of the fixed supply", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    await bitgov.transfer(recipient.address, 1_234_567n);

    expect(await bitgov.balanceOf(recipient.address)).to.equal(1_234_567n);
    expect(await bitgov.balanceOf(owner.address)).to.equal(maxSupply - 1_234_567n);
  });

  // ── ERC20Votes ─────────────────────────────────────────────────────────────

  it("Should return zero voting power before delegation", async function () {
    const [owner] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    expect(await bitgov.getVotes(owner.address)).to.equal(0n);
  });

  it("Should activate voting power after self-delegation", async function () {
    const [owner] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    await bitgov.delegate(owner.address);

    expect(await bitgov.getVotes(owner.address)).to.equal(maxSupply);
  });

  it("Should transfer voting power when delegating to another address", async function () {
    const [owner, delegate] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    await bitgov.delegate(delegate.address);

    expect(await bitgov.getVotes(delegate.address)).to.equal(maxSupply);
    expect(await bitgov.getVotes(owner.address)).to.equal(0n);
  });

  it("Should checkpoint past votes correctly", async function () {
    const [owner] = await ethers.getSigners();
    const bitgov = await ethers.deployContract("BITGOV", [owner.address]);

    await bitgov.delegate(owner.address);
    const snapshotBlock = await ethers.provider.getBlockNumber();

    // Burn some tokens and advance a block so the snapshot is in the past
    await bitgov.burn(1_000n);
    await networkHelpers.mine(1);

    expect(await bitgov.getPastVotes(owner.address, snapshotBlock)).to.equal(maxSupply);
    expect(await bitgov.getVotes(owner.address)).to.equal(maxSupply - 1_000n);
  });
})
