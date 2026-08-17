import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("XCAD", function () {
  const initialSupply = 1_000_000n * 10n ** 6n;

  // ── Deployment ────────────────────────────────────────────────────────────

  it("Should set the token metadata and initial supply", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, initialSupply, 0n]);

    expect(await xcad.name()).to.equal("BitGov Canadian Dollar");
    expect(await xcad.symbol()).to.equal("XCAD");
    expect(await xcad.decimals()).to.equal(6n);
    expect(await xcad.totalSupply()).to.equal(initialSupply);
    expect(await xcad.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should set the deployer-provided owner", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    expect(await xcad.owner()).to.equal(owner.address);
  });

  it("Should initialise supplyCap from the constructor argument", async function () {
    const [owner] = await ethers.getSigners();
    const cap = 5_000_000n * 10n ** 6n;
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, cap]);

    expect(await xcad.supplyCap()).to.equal(cap);
  });

  it("Should revert deployment when initial supply exceeds the cap", async function () {
    const [owner] = await ethers.getSigners();
    const cap = 500_000n * 10n ** 6n; // less than initialSupply

    // Deploy a valid instance first to use as the custom-error interface
    const xcadForInterface = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await expect(
      ethers.deployContract("XCAD", [owner.address, owner.address, initialSupply, cap])
    ).to.be.revertedWithCustomError(xcadForInterface, "SupplyCapExceeded");
  });

  // ── Minting ───────────────────────────────────────────────────────────────

  it("Should allow the owner to mint new XCAD", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await xcad.mint(recipient.address, 250_000n);

    expect(await xcad.totalSupply()).to.equal(250_000n);
    expect(await xcad.balanceOf(recipient.address)).to.equal(250_000n);
  });

  it("Should revert when a non-owner tries to mint", async function () {
    const [owner, attacker, recipient] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await expect(xcad.connect(attacker).mint(recipient.address, 1n)).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  // ── Supply cap ────────────────────────────────────────────────────────────

  it("Should allow minting up to the supply cap", async function () {
    const [owner] = await ethers.getSigners();
    const cap = 1_000_000n;
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, cap]);

    await xcad.mint(owner.address, cap); // exactly at cap

    expect(await xcad.totalSupply()).to.equal(cap);
  });

  it("Should revert when minting would exceed the supply cap", async function () {
    const [owner] = await ethers.getSigners();
    const cap = 1_000_000n;
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, cap]);

    await expect(xcad.mint(owner.address, cap + 1n)).to.be.revertedWithCustomError(
      xcad,
      "SupplyCapExceeded"
    );
  });

  it("Should allow the owner to raise the supply cap", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 1_000_000n]);

    await xcad.setSupplyCap(2_000_000n);

    expect(await xcad.supplyCap()).to.equal(2_000_000n);
  });

  it("Should allow the owner to remove the supply cap by setting it to zero", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 1_000_000n]);

    await xcad.setSupplyCap(0n);
    await xcad.mint(owner.address, 999_999_999n); // no cap now

    expect(await xcad.totalSupply()).to.equal(999_999_999n);
  });

  it("Should emit SupplyCapUpdated when the cap changes", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 1_000_000n]);

    await expect(xcad.setSupplyCap(2_000_000n))
      .to.emit(xcad, "SupplyCapUpdated")
      .withArgs(1_000_000n, 2_000_000n);
  });

  it("Should revert when a non-owner tries to set the supply cap", async function () {
    const [owner, attacker] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await expect(xcad.connect(attacker).setSupplyCap(1_000_000n)).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  // ── Decimals ──────────────────────────────────────────────────────────────

  it("Should return 6 decimals by default", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    expect(await xcad.decimals()).to.equal(6n);
  });

  it("Should allow the owner to update decimals", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await xcad.setDecimals(8n);

    expect(await xcad.decimals()).to.equal(8n);
  });

  it("Should emit DecimalsUpdated when decimals change", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await expect(xcad.setDecimals(8n))
      .to.emit(xcad, "DecimalsUpdated")
      .withArgs(6n, 8n);
  });

  it("Should revert when a non-owner tries to update decimals", async function () {
    const [owner, attacker] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await expect(xcad.connect(attacker).setDecimals(8n)).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  // ── Pause ─────────────────────────────────────────────────────────────────

  it("Should allow the owner to pause and unpause transfers", async function () {
    const [owner, recipient] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, initialSupply, 0n]);

    await xcad.pause();
    await expect(xcad.transfer(recipient.address, 100n)).to.be.revertedWithCustomError(
      xcad,
      "EnforcedPause"
    );

    await xcad.unpause();
    await xcad.transfer(recipient.address, 100n);
    expect(await xcad.balanceOf(recipient.address)).to.equal(100n);
  });

  it("Should block minting while paused", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await xcad.pause();
    await expect(xcad.mint(owner.address, 100n)).to.be.revertedWithCustomError(
      xcad,
      "EnforcedPause"
    );
  });

  it("Should revert when a non-owner tries to pause", async function () {
    const [owner, attacker] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, 0n, 0n]);

    await expect(xcad.connect(attacker).pause()).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  // ── Burning ───────────────────────────────────────────────────────────────

  it("Should allow a holder to burn their own XCAD", async function () {
    const [owner] = await ethers.getSigners();
    const xcad = await ethers.deployContract("XCAD", [owner.address, owner.address, initialSupply, 0n]);

    await xcad.burn(125_000n);

    expect(await xcad.totalSupply()).to.equal(initialSupply - 125_000n);
    expect(await xcad.balanceOf(owner.address)).to.equal(initialSupply - 125_000n);
  });
});
