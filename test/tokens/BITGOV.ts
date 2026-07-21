import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

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
});
