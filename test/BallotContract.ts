import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("BallotContract", function () {
  const proposals = ["Alice", "Bob", "Carol"];

  // ── Deployment ────────────────────────────────────────────────────────────

  it("Should store proposal names at deployment", async function () {
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    expect(await ballot.proposalCount()).to.equal(3n);
    const [name] = await ballot.proposals(0);
    expect(name).to.equal("Alice");
  });

  it("Should set the deployer as chairperson", async function () {
    const [chairperson] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    expect(await ballot.chairperson()).to.equal(chairperson.address);
  });

  // ── Voter registration ────────────────────────────────────────────────────

  it("Should register a voter and set their weight to 1", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    const record = await ballot.voters(voter.address);
    expect(record.registered).to.be.true;
    expect(record.weight).to.equal(1n);
  });

  it("Should register multiple voters in one call", async function () {
    const [, v1, v2, v3] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoters([v1.address, v2.address, v3.address]);
    const r1 = await ballot.voters(v1.address);
    const r2 = await ballot.voters(v2.address);
    const r3 = await ballot.voters(v3.address);
    expect(r1.registered).to.be.true;
    expect(r2.registered).to.be.true;
    expect(r3.registered).to.be.true;
  });

  it("Should emit VoterRegistered when registering a voter", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await expect(ballot.registerVoter(voter.address))
      .to.emit(ballot, "VoterRegistered")
      .withArgs(voter.address);
  });

  it("Should revert when a non-chairperson tries to register a voter", async function () {
    const [, impostor, target] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await expect(
      ballot.connect(impostor).registerVoter(target.address)
    ).to.be.revertedWithCustomError(ballot, "NotChairperson");
  });

  it("Should revert on a duplicate registration", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await expect(ballot.registerVoter(voter.address)).to.be.revertedWithCustomError(
      ballot,
      "AlreadyRegistered"
    );
  });

  // ── Voting ────────────────────────────────────────────────────────────────

  it("Should record a vote and update the proposal tally", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await ballot.connect(voter).vote(1); // vote for Bob (index 1)

    const [, voteCount] = await ballot.proposals(1);
    expect(voteCount).to.equal(1n);
    expect(await ballot.winnerName()).to.equal("Bob");
  });

  it("Should emit VoteCast when a voter casts their ballot", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await expect(ballot.connect(voter).vote(2))
      .to.emit(ballot, "VoteCast")
      .withArgs(voter.address, 2n);
  });

  it("Should revert when an unregistered address tries to vote", async function () {
    const [, unregistered] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await expect(ballot.connect(unregistered).vote(0)).to.be.revertedWithCustomError(
      ballot,
      "NotRegistered"
    );
  });

  it("Should revert on a double vote", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await ballot.connect(voter).vote(0);
    await expect(ballot.connect(voter).vote(0)).to.be.revertedWithCustomError(
      ballot,
      "AlreadyVoted"
    );
  });

  it("Should revert on an out-of-bounds proposal index", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await expect(ballot.connect(voter).vote(99)).to.be.revertedWithCustomError(
      ballot,
      "InvalidProposal"
    );
  });

  // ── Delegation ────────────────────────────────────────────────────────────

  it("Should transfer weight through delegation (delegate votes after)", async function () {
    const [, delegator, delegate] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(delegator.address);
    await ballot.registerVoter(delegate.address);

    // delegator hands their weight to delegate before delegate has voted
    await ballot.connect(delegator).delegate(delegate.address);
    // delegate now carries weight 2 and votes for Alice
    await ballot.connect(delegate).vote(0);

    const [, voteCount] = await ballot.proposals(0);
    expect(voteCount).to.equal(2n); // own vote (1) + delegated weight (1)
  });

  it("Should immediately credit the tally when delegating to an already-voted delegate", async function () {
    const [, delegator, delegate] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(delegator.address);
    await ballot.registerVoter(delegate.address);

    // delegate votes for Alice first
    await ballot.connect(delegate).vote(0);
    // delegator then hands their weight to the already-voted delegate
    await ballot.connect(delegator).delegate(delegate.address);

    const [, voteCount] = await ballot.proposals(0);
    expect(voteCount).to.equal(2n); // delegate's own vote + delegator's late weight
  });

  it("Should emit VoteDelegated when delegating", async function () {
    const [, delegator, delegate] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(delegator.address);
    await ballot.registerVoter(delegate.address);

    await expect(ballot.connect(delegator).delegate(delegate.address))
      .to.emit(ballot, "VoteDelegated")
      .withArgs(delegator.address, delegate.address);
  });

  it("Should revert on self-delegation", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await expect(ballot.connect(voter).delegate(voter.address)).to.be.revertedWithCustomError(
      ballot,
      "SelfDelegation"
    );
  });

  it("Should revert when delegation would create a cycle", async function () {
    const [, v1, v2] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoters([v1.address, v2.address]);
    await ballot.connect(v1).delegate(v2.address); // v1 → v2
    // v2 → v1 would form a cycle
    await expect(ballot.connect(v2).delegate(v1.address)).to.be.revertedWithCustomError(
      ballot,
      "DelegationLoop"
    );
  });

  // ── Close voting ──────────────────────────────────────────────────────────

  it("Should prevent new votes after closeVoting", async function () {
    const [, voter] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoter(voter.address);
    await ballot.closeVoting();

    await expect(ballot.connect(voter).vote(0)).to.be.revertedWithCustomError(
      ballot,
      "VotingIsClosed"
    );
  });

  it("Should emit VotingClosed when closing", async function () {
    const ballot = await ethers.deployContract("BallotContract", [proposals]);
    await expect(ballot.closeVoting()).to.emit(ballot, "VotingClosed");
  });

  it("Should revert if a non-chairperson tries to close voting", async function () {
    const [, impostor] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await expect(ballot.connect(impostor).closeVoting()).to.be.revertedWithCustomError(
      ballot,
      "NotChairperson"
    );
  });

  // ── Winner ────────────────────────────────────────────────────────────────

  it("Should correctly identify the proposal with the most votes", async function () {
    const [, v1, v2, v3] = await ethers.getSigners();
    const ballot = await ethers.deployContract("BallotContract", [proposals]);

    await ballot.registerVoters([v1.address, v2.address, v3.address]);
    await ballot.connect(v1).vote(2); // Carol
    await ballot.connect(v2).vote(2); // Carol
    await ballot.connect(v3).vote(0); // Alice

    expect(await ballot.winnerName()).to.equal("Carol");
  });
});
