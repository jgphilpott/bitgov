import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// ── Governance parameters ───────────────────────────────────────────────────
// Adjust these before deploying to production.

/** Minimum seconds between a proposal passing and its execution (~2 days). */
const TIMELOCK_MIN_DELAY = 172_800n;

/** Blocks before voting opens after a proposal is submitted (~1 day at 12 s/block). */
const VOTING_DELAY = 7_200n;

/** Blocks a vote stays open (~1 week at 12 s/block). */
const VOTING_PERIOD = 50_400n;

/** Minimum BITGOV base units needed to submit a proposal (0 = any holder). */
const PROPOSAL_THRESHOLD = 0n;

/** Quorum as a percentage of total supply (4 = 4%). */
const QUORUM_NUMERATOR = 4n;

/** Initial XCAD supply minted to the deployer at deployment. */
const INITIAL_XCAD_SUPPLY = 1_000_000n * 10n ** 6n;

/** Initial XCAD supply cap (0 = uncapped). */
const INITIAL_XCAD_SUPPLY_CAP = 0n;

// ───────────────────────────────────────────────────────────────────────────

const XCADGovernorModule = buildModule("XCADGovernorModule", (m) => {
  const deployer = m.getAccount(0);

  // 1. Deploy BITGOV governance token.
  //    Holders must call delegate(self) once to activate on-chain voting power.
  const bitgov = m.contract("BITGOV", [deployer]);

  // 2. Deploy XCADTimelockController with deployer as temporary admin.
  //    After the governor is deployed, grant it PROPOSER, CANCELLER, and EXECUTOR
  //    roles on the timelock, then renounce the deployer's DEFAULT_ADMIN_ROLE.
  const timelock = m.contract("XCADTimelockController", [
    TIMELOCK_MIN_DELAY,
    [],       // no proposers yet — set below via grantRole after governor is known
    [],       // no executors yet
    deployer, // temporary admin; renounce after role setup
  ]);

  // 3. Deploy XCADGovernor pointing at BITGOV and the timelock.
  const governor = m.contract("XCADGovernor", [
    bitgov,
    timelock,
    VOTING_DELAY,
    VOTING_PERIOD,
    PROPOSAL_THRESHOLD,
    QUORUM_NUMERATOR,
  ]);

  // 4. Grant PROPOSER_ROLE + CANCELLER_ROLE + EXECUTOR_ROLE to the governor.
  //    keccak256("PROPOSER_ROLE"), keccak256("CANCELLER_ROLE"), keccak256("EXECUTOR_ROLE")
  const PROPOSER_ROLE  = "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1";
  const CANCELLER_ROLE = "0xfd643c72710c63c0180259aba6b2d05451e3591a24c503a6eb5527547a06bbc4";
  const EXECUTOR_ROLE  = "0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63";

  m.call(timelock, "grantRole", [PROPOSER_ROLE,  governor], { id: "grantProposerRole"  });
  m.call(timelock, "grantRole", [CANCELLER_ROLE, governor], { id: "grantCancellerRole" });
  m.call(timelock, "grantRole", [EXECUTOR_ROLE,  governor], { id: "grantExecutorRole"  });

  // 5. Deploy XCAD with the timelock as owner so only the DAO can mint/pause/update.
  const xcad = m.contract("XCAD", [
    timelock,             // owner = timelock (DAO-controlled)
    deployer,             // initial supply recipient
    INITIAL_XCAD_SUPPLY,
    INITIAL_XCAD_SUPPLY_CAP,
  ]);

  return { bitgov, timelock, governor, xcad };
});

export default XCADGovernorModule;
