import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("TokenWeightedVote", function () {
  const proposals = ["Proposal A", "Proposal B", "Proposal C"];

  // ── Deployment ────────────────────────────────────────────────────────────

  it("Should store proposal names at deployment", async function () {
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    expect(await twv.proposalCount()).to.equal(3n);
    const [name] = await twv.proposals(0);
    expect(name).to.equal("Proposal A");
  });

  it("Should set the deployer as owner", async function () {
    const [owner] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    expect(await twv.owner()).to.equal(owner.address);
  });

  // ── Token allocation ──────────────────────────────────────────────────────

  it("Should allocate tokens to a voter and update totalSupply", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 100n);

    const record = await twv.voters(voter.address);
    expect(record.balance).to.equal(100n);
    expect(await twv.totalSupply()).to.equal(100n);
  });

  it("Should accumulate balance across multiple allocations", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 40n);
    await twv.allocateTokens(voter.address, 60n);

    const record = await twv.voters(voter.address);
    expect(record.balance).to.equal(100n);
  });

  it("Should emit TokensAllocated when allocating", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await expect(twv.allocateTokens(voter.address, 50n))
      .to.emit(twv, "TokensAllocated")
      .withArgs(voter.address, 50n);
  });

  it("Should revert when a non-owner tries to allocate tokens", async function () {
    const [, impostor, target] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await expect(
      twv.connect(impostor).allocateTokens(target.address, 50n)
    ).to.be.revertedWithCustomError(twv, "NotOwner");
  });

  // ── Voting ────────────────────────────────────────────────────────────────

  it("Should cast a full-weight vote and update the tally", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 100n);
    await twv.connect(voter).vote(0, 100n);

    const [, voteCount] = await twv.proposals(0);
    expect(voteCount).to.equal(100n);
    expect(await twv.winnerName()).to.equal("Proposal A");
  });

  it("Should allow a split vote across multiple proposals", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 100n);
    await twv.connect(voter).vote(0, 60n); // 60 tokens → Proposal A
    await twv.connect(voter).vote(1, 40n); // 40 tokens → Proposal B

    const [, countA] = await twv.proposals(0);
    const [, countB] = await twv.proposals(1);
    expect(countA).to.equal(60n);
    expect(countB).to.equal(40n);
    expect(await twv.winnerName()).to.equal("Proposal A");
  });

  it("Should correctly report remaining tokens after voting", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 50n);
    await twv.connect(voter).vote(1, 20n);

    expect(await twv.remainingTokens(voter.address)).to.equal(30n);
  });

  it("Should emit VoteCast with the correct arguments", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 50n);
    await expect(twv.connect(voter).vote(0, 50n))
      .to.emit(twv, "VoteCast")
      .withArgs(voter.address, 0n, 50n);
  });

  it("Should pick the proposal with the most token weight", async function () {
    const [, v1, v2] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(v1.address, 10n);
    await twv.allocateTokens(v2.address, 90n);

    await twv.connect(v1).vote(0, 10n); // Proposal A gets 10 tokens
    await twv.connect(v2).vote(1, 90n); // Proposal B gets 90 tokens

    expect(await twv.winnerName()).to.equal("Proposal B");
  });

  it("Should revert when voting with zero weight", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 10n);
    await expect(twv.connect(voter).vote(0, 0n)).to.be.revertedWithCustomError(
      twv,
      "ZeroWeight"
    );
  });

  it("Should revert when vote weight exceeds remaining balance", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 10n);
    await expect(twv.connect(voter).vote(0, 11n)).to.be.revertedWithCustomError(
      twv,
      "InsufficientTokens"
    );
  });

  it("Should revert when partial votes exceed the total balance", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 10n);
    await twv.connect(voter).vote(0, 7n);
    // 4 more would exceed the remaining 3
    await expect(twv.connect(voter).vote(1, 4n)).to.be.revertedWithCustomError(
      twv,
      "InsufficientTokens"
    );
  });

  it("Should revert on an out-of-bounds proposal index", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 10n);
    await expect(twv.connect(voter).vote(99, 5n)).to.be.revertedWithCustomError(
      twv,
      "InvalidProposal"
    );
  });

  // ── Close voting ──────────────────────────────────────────────────────────

  it("Should prevent new votes after closeVoting", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.allocateTokens(voter.address, 10n);
    await twv.closeVoting();

    await expect(twv.connect(voter).vote(0, 5n)).to.be.revertedWithCustomError(
      twv,
      "VotingIsClosed"
    );
  });

  it("Should prevent token allocation after closeVoting", async function () {
    const [, voter] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await twv.closeVoting();
    await expect(twv.allocateTokens(voter.address, 10n)).to.be.revertedWithCustomError(
      twv,
      "VotingIsClosed"
    );
  });

  it("Should emit VotingClosed when closing", async function () {
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);
    await expect(twv.closeVoting()).to.emit(twv, "VotingClosed");
  });

  it("Should revert if a non-owner tries to close voting", async function () {
    const [, impostor] = await ethers.getSigners();
    const twv = await ethers.deployContract("TokenWeightedVote", [proposals]);

    await expect(twv.connect(impostor).closeVoting()).to.be.revertedWithCustomError(
      twv,
      "NotOwner"
    );
  });
});
