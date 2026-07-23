// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { TimelockController } from "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title XCADTimelockController
/// @notice Governance timelock for the XCAD stablecoin ecosystem.
///         All DAO-approved parameter changes (supply cap, decimals, pause) are
///         routed through this contract, imposing a mandatory delay before they
///         take effect.  This delay gives token holders time to react to
///         unfavourable governance decisions before they are enacted.
///
///         Role setup (execute after deploying XCADGovernor):
///           grantRole(PROPOSER_ROLE,  governor)
///           grantRole(CANCELLER_ROLE, governor)
///           grantRole(EXECUTOR_ROLE,  governor)
///
///         In production the temporary admin account (passed as `admin`) should
///         renounce DEFAULT_ADMIN_ROLE once roles are configured so that the
///         timelock is fully self-governed.
contract XCADTimelockController is TimelockController {
    /// @param minDelay   Minimum seconds between a proposal passing and its execution.
    ///                   Recommended: 172 800 (2 days) for production.
    /// @param proposers  Accounts authorised to schedule operations.
    ///                   In production this should contain only the XCADGovernor address.
    /// @param executors  Accounts authorised to execute ready operations.
    ///                   In production this should contain only the XCADGovernor address.
    /// @param admin      Temporary admin for initial role configuration.
    ///                   Pass address(0) to skip; otherwise renounce after setup.
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
