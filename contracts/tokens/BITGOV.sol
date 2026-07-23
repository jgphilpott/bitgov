// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Capped } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import { ERC20Votes } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title BITGOV
/// @notice A scarce ERC-20 governance token with a Bitcoin-style hard cap.
///         The full fixed supply is minted once at deployment and can never be
///         increased beyond the cap. Burning is allowed, which can only reduce
///         the circulating supply over time.
///
///         Token holders must call delegate(self) once to activate their on-chain
///         voting weight before participating in XCADGovernor proposals.
contract BITGOV is ERC20, ERC20Burnable, ERC20Capped, ERC20Votes {
    uint8 private constant TOKEN_DECIMALS = 8;
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** TOKEN_DECIMALS;

    /// @param initialRecipient Account that receives the full capped supply.
    constructor(address initialRecipient)
        ERC20("BitGov", "BITGOV")
        ERC20Capped(MAX_SUPPLY)
        EIP712("BitGov", "1")
    {
        _mint(initialRecipient, MAX_SUPPLY);
    }

    /// @notice Returns the number of decimal places used by BITGOV.
    /// @dev Eight decimals mirrors Bitcoin's satoshi precision.
    function decimals() public pure override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    /// @dev Resolves _update conflict between ERC20Capped and ERC20Votes.
    ///      ERC20Capped enforces the hard cap on mints; ERC20Votes checkpoints
    ///      voting balances at each transfer.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped, ERC20Votes)
    {
        super._update(from, to, value);
    }
}
