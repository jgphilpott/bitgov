import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("XCAD", function () {
  const initialSupply = 1_000_000n * 10n ** 6n;

  it("Should set the token metadata and initial supply", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, initialSupply]);

    expect(await xcad.name()).to.equal("BitGov Canadian Dollar");
    expect(await xcad.symbol()).to.equal("XCAD");
    expect(await xcad.decimals()).to.equal(6n);
    expect(await xcad.totalSupply()).to.equal(initialSupply);
    expect(await xcad.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should set the deployer-provided owner", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n]);

    expect(await xcad.owner()).to.equal(owner.address);
  });

  it("Should allow the owner to mint new XCAD", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n]);

    await xcad.mint(recipient.address, 250_000n);

    expect(await xcad.totalSupply()).to.equal(250_000n);
    expect(await xcad.balanceOf(recipient.address)).to.equal(250_000n);
  });

  it("Should revert when a non-owner tries to mint", async function () {
    const [owner, attacker, recipient] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n]);

    await expect(xcad.connect(attacker).mint(recipient.address, 1n)).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  it("Should allow a holder to burn their own XCAD", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, initialSupply]);

    await xcad.burn(125_000n);

    expect(await xcad.totalSupply()).to.equal(initialSupply - 125_000n);
    expect(await xcad.balanceOf(owner.address)).to.equal(initialSupply - 125_000n);
  });
});
