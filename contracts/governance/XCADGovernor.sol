// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Governor } from "@openzeppelin/contracts/governance/Governor.sol";
import { GovernorSettings } from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import { GovernorCountingSimple } from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import { GovernorVotes } from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import { GovernorVotesQuorumFraction } from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import { GovernorTimelockControl } from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import { IVotes } from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title XCADGovernor
/// @notice On-chain DAO governor for the XCAD stablecoin ecosystem.
///         Voting power is derived from BITGOV balances at the block when a
///         proposal is submitted.  Token holders must self-delegate (delegate to
///         their own address) once to activate on-chain checkpointing.
///
///         Proposal lifecycle:
///           1. propose()   — any holder meeting proposalThreshold submits a proposal.
///           2. (wait votingDelay blocks)
///           3. castVote()  — BITGOV holders vote For / Against / Abstain.
///           4. (wait votingPeriod blocks)
///           5. queue()     — passed proposal is queued in the timelock.
///           6. (wait timelock minDelay seconds)
///           7. execute()   — timelock executes the approved on-chain action.
contract XCADGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    /// @param token_                    BITGOV token address (must implement IVotes).
    /// @param timelock_                 XCADTimelockController that owns XCAD.
    /// @param initialVotingDelay        Blocks before voting opens after a proposal is submitted.
    /// @param initialVotingPeriod       Blocks a vote stays open.
    /// @param initialProposalThreshold  Minimum BITGOV base units needed to submit a proposal.
    /// @param quorumNumeratorValue      Quorum as a percentage of total supply (4 → 4 %).
    constructor(
        IVotes token_,
        TimelockController timelock_,
        uint48 initialVotingDelay,
        uint32 initialVotingPeriod,
        uint256 initialProposalThreshold,
        uint256 quorumNumeratorValue
    )
        Governor("XCADGovernor")
        GovernorSettings(initialVotingDelay, initialVotingPeriod, initialProposalThreshold)
        GovernorVotes(token_)
        GovernorVotesQuorumFraction(quorumNumeratorValue)
        GovernorTimelockControl(timelock_)
    {}

    // ─────────────────────────────────────────────────────────────────────────
    // Required overrides — resolve multiple-inheritance ambiguities
    // ─────────────────────────────────────────────────────────────────────────

    function votingDelay()
        public view override(Governor, GovernorSettings) returns (uint256)
    {
        return super.votingDelay();
    }

    function votingPeriod()
        public view override(Governor, GovernorSettings) returns (uint256)
    {
        return super.votingPeriod();
    }

    function quorum(uint256 timepoint)
        public view override(Governor, GovernorVotesQuorumFraction) returns (uint256)
    {
        return super.quorum(timepoint);
    }

    function proposalThreshold()
        public view override(Governor, GovernorSettings) returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl) returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl) returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal view override(Governor, GovernorTimelockControl) returns (address)
    {
        return super._executor();
    }
}
