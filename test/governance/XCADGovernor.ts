import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

// ── Proposal support values (GovernorCountingSimple) ──────────────────────
const AGAINST = 0n;
const FOR     = 1n;
const ABSTAIN = 2n;

// ── Governance parameters used across tests ───────────────────────────────
const VOTING_DELAY  = 1n;  // blocks before voting opens
const VOTING_PERIOD = 10n; // blocks a vote stays open
const PROPOSAL_THRESHOLD = 0n; // no minimum to propose
const QUORUM_NUMERATOR   = 4n; // 4% of total supply
const TIMELOCK_DELAY     = 0n; // no delay in tests

describe("XCADGovernor", function () {

  // ── Setup helper ─────────────────────────────────────────────────────────

  async function setup() {
    const [deployer, voter] = await ethers.getSigners();

    // 1. Deploy BITGOV and self-delegate to activate voting checkpoints
    const bitgov = await ethers.deployContract("BITGOV", [deployer.address]);
    await bitgov.delegate(deployer.address);
    await networkHelpers.mine(1); // advance so delegation is in a past block

    // 2. Deploy XCADTimelockController (admin = deployer for initial role setup)
    const timelock = await ethers.deployContract("XCADTimelockController", [
      TIMELOCK_DELAY,
      [],              // no proposers initially
      [],              // no executors initially
      deployer.address // deployer gets DEFAULT_ADMIN_ROLE for role configuration
    ]);

    // 3. Deploy XCADGovernor
    const governor = await ethers.deployContract("XCADGovernor", [
      await bitgov.getAddress(),
      await timelock.getAddress(),
      VOTING_DELAY,
      VOTING_PERIOD,
      PROPOSAL_THRESHOLD,
      QUORUM_NUMERATOR,
    ]);

    // 4. Grant PROPOSER, CANCELLER, and EXECUTOR roles to the governor
    const PROPOSER_ROLE  = await timelock.PROPOSER_ROLE();
    const CANCELLER_ROLE = await timelock.CANCELLER_ROLE();
    const EXECUTOR_ROLE  = await timelock.EXECUTOR_ROLE();
    await timelock.grantRole(PROPOSER_ROLE,  await governor.getAddress());
    await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress());
    await timelock.grantRole(EXECUTOR_ROLE,  await governor.getAddress());

    // 5. Deploy XCAD with the timelock as owner (0n supply cap = uncapped)
    const xcad = await ethers.deployContract("XCAD", [
      await timelock.getAddress(),
      deployer.address,
      1_000_000n * 10n ** 6n,
      0n,
    ]);

    return { deployer, voter, bitgov, timelock, governor, xcad };
  }

  // ── Full proposal helper ──────────────────────────────────────────────────

  async function runProposal(
    governor: Awaited<ReturnType<typeof ethers.deployContract>>,
    targets: string[],
    values: bigint[],
    calldatas: string[],
    description: string
  ) {
    const descriptionHash = ethers.id(description);

    // Propose
    await governor.propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

    // Advance past voting delay
    await networkHelpers.mine(Number(VOTING_DELAY) + 1);

    // Vote For
    await governor.castVote(proposalId, FOR);

    // Advance past voting period
    await networkHelpers.mine(Number(VOTING_PERIOD) + 1);

    // Queue in timelock
    await governor.queue(targets, values, calldatas, descriptionHash);

    // Execute (minDelay = 0 in tests)
    await governor.execute(targets, values, calldatas, descriptionHash);

    return proposalId;
  }

  // ── Deployment ────────────────────────────────────────────────────────────

  it("Should configure voting parameters correctly", async function () {
    const { governor, bitgov, timelock } = await setup();

    expect(await governor.votingDelay()).to.equal(VOTING_DELAY);
    expect(await governor.votingPeriod()).to.equal(VOTING_PERIOD);
    expect(await governor.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
    expect(await governor.token()).to.equal(await bitgov.getAddress());
    expect(await governor.timelock()).to.equal(await timelock.getAddress());
  });

  it("Should name the governor XCADGovernor", async function () {
    const { governor } = await setup();

    expect(await governor.name()).to.equal("XCADGovernor");
  });

  // ── Voting power ──────────────────────────────────────────────────────────

  it("Should reflect full BITGOV supply as voting power after delegation", async function () {
    const { deployer, bitgov } = await setup();
    const maxSupply = await bitgov.MAX_SUPPLY();

    expect(await bitgov.getVotes(deployer.address)).to.equal(maxSupply);
  });

  it("Should require queuing before execution", async function () {
    const { governor, timelock, xcad } = await setup();
    const xcadInterface = new ethers.Interface(["function setSupplyCap(uint256)"]);
    const calldata = xcadInterface.encodeFunctionData("setSupplyCap", [1_000_000n]);
    const description = "Test: requires queuing check";
    const descriptionHash = ethers.id(description);

    const targets = [await xcad.getAddress()];
    const values = [0n];
    const calldatas = [calldata];

    await governor.propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);
    await networkHelpers.mine(Number(VOTING_DELAY) + 1);
    await governor.castVote(proposalId, FOR);
    await networkHelpers.mine(Number(VOTING_PERIOD) + 1);

    // Attempt to execute without queuing first should revert (the timelock
    // rejects the unscheduled operation)
    await expect(
      governor.execute(targets, values, calldatas, descriptionHash)
    ).to.be.revertedWithCustomError(timelock, "TimelockUnexpectedOperationState");
  });

  // ── Governance lifecycle: setSupplyCap ────────────────────────────────────

  it("Should raise the XCAD supply cap through a full governance proposal", async function () {
    const { governor, xcad } = await setup();

    const newCap = 5_000_000n * 10n ** 6n;
    const xcadInterface = new ethers.Interface(["function setSupplyCap(uint256)"]);
    const calldata = xcadInterface.encodeFunctionData("setSupplyCap", [newCap]);
    const description = "Governance: raise XCAD supply cap to 5M";

    await runProposal(
      governor,
      [await xcad.getAddress()],
      [0n],
      [calldata],
      description
    );

    expect(await xcad.supplyCap()).to.equal(newCap);
  });

  // ── Governance lifecycle: setDecimals ─────────────────────────────────────

  it("Should update XCAD decimals through a full governance proposal", async function () {
    const { governor, xcad } = await setup();

    const newDecimals = 8n;
    const xcadInterface = new ethers.Interface(["function setDecimals(uint8)"]);
    const calldata = xcadInterface.encodeFunctionData("setDecimals", [newDecimals]);
    const description = "Governance: change XCAD decimals to 8";

    await runProposal(
      governor,
      [await xcad.getAddress()],
      [0n],
      [calldata],
      description
    );

    expect(await xcad.decimals()).to.equal(newDecimals);
  });

  // ── Governance lifecycle: pause ───────────────────────────────────────────

  it("Should pause XCAD through a full governance proposal", async function () {
    const { deployer, governor, xcad } = await setup();

    const xcadInterface = new ethers.Interface(["function pause()"]);
    const calldata = xcadInterface.encodeFunctionData("pause");
    const description = "Governance: pause XCAD for emergency maintenance";

    await runProposal(
      governor,
      [await xcad.getAddress()],
      [0n],
      [calldata],
      description
    );

    // Transfers should now be blocked
    await expect(
      xcad.connect(deployer).transfer(deployer.address, 1n)
    ).to.be.revertedWithCustomError(xcad, "EnforcedPause");
  });

  // ── Direct owner-guard checks ─────────────────────────────────────────────

  it("Should revert when a non-timelock address tries to set the supply cap", async function () {
    const { deployer, xcad } = await setup();

    // The timelock owns XCAD; the deployer should be rejected
    await expect(xcad.connect(deployer).setSupplyCap(1_000n)).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  it("Should revert when a non-timelock address tries to set decimals", async function () {
    const { deployer, xcad } = await setup();

    await expect(xcad.connect(deployer).setDecimals(18n)).to.be.revertedWithCustomError(
      xcad,
      "OwnableUnauthorizedAccount"
    );
  });

  // ── Voting rejection ──────────────────────────────────────────────────────

  it("Should defeat a proposal that receives no votes", async function () {
    const { governor, xcad } = await setup();

    const xcadInterface = new ethers.Interface(["function setSupplyCap(uint256)"]);
    const calldata = xcadInterface.encodeFunctionData("setSupplyCap", [999n]);
    const description = "Defeated: no votes cast";
    const descriptionHash = ethers.id(description);

    const targets = [await xcad.getAddress()];
    const values = [0n];
    const calldatas = [calldata];

    await governor.propose(targets, values, calldatas, description);
    const proposalId = await governor.hashProposal(targets, values, calldatas, descriptionHash);

    // Skip past voting period without casting any votes
    await networkHelpers.mine(Number(VOTING_DELAY) + Number(VOTING_PERIOD) + 2);

    // State should be Defeated (3)
    expect(await governor.state(proposalId)).to.equal(3n);
  });
});
