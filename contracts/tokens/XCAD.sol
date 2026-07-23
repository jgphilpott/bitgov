// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title XCAD
/// @notice A DAO-governed ERC-20 token for a Canadian-dollar-pegged stablecoin.
///         The peg itself must be maintained off-chain through reserve management,
///         redemptions, and governance. On-chain, this contract provides controlled
///         issuance (owner-only minting) plus standard ERC-20 transfers and burning.
///
///         The owner (expected to be an XCADTimelockController) can adjust:
///           - supplyCap:  maximum base units that may ever be minted (0 = uncapped)
///           - decimals:   display precision (cosmetic only — does not rescale balances)
///           - pause/unpause: emergency circuit-breaker halting all transfers and mints
contract XCAD is ERC20, ERC20Burnable, Ownable, Pausable {
    /// @dev Display precision. Cosmetic only: changing it does not rescale stored balances.
    uint8 private _tokenDecimals;

    /// @notice Maximum number of base units that may ever exist. Zero means uncapped.
    uint256 public supplyCap;

    /// @notice Emitted when the owner updates the supply cap.
    event SupplyCapUpdated(uint256 oldCap, uint256 newCap);

    /// @notice Emitted when the owner updates the token decimals.
    /// @dev WARNING: decimals() is display-only. Changing it mid-life alters how UIs
    ///      render existing balances but does not rescale any stored amounts.
    event DecimalsUpdated(uint8 oldDecimals, uint8 newDecimals);

    /// @dev Attempted mint would exceed the active supply cap.
    error SupplyCapExceeded(uint256 requested, uint256 cap);

    /// @param initialOwner      Account that controls minting, parameters, and pause
    ///                          (use an XCADTimelockController in production).
    /// @param initialRecipient  Account that receives the initial token supply.
    /// @param initialSupply     Number of base units minted at deployment.
    /// @param initialSupplyCap  Maximum base units that may ever be minted (0 = uncapped).
    constructor(
        address initialOwner,
        address initialRecipient,
        uint256 initialSupply,
        uint256 initialSupplyCap
    )
        ERC20("BitGov Canadian Dollar", "XCAD")
        Ownable(initialOwner)
    {
        _tokenDecimals = 6;
        supplyCap = initialSupplyCap;

        if (initialSupply > 0) {
            if (initialSupplyCap > 0 && initialSupply > initialSupplyCap) {
                revert SupplyCapExceeded(initialSupply, initialSupplyCap);
            }
            _mint(initialRecipient, initialSupply);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Owner / DAO actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Mints new XCAD to `to`.
    /// @dev Reverts if a non-zero supplyCap would be exceeded.
    ///      Peg discipline is external to the contract; only the owner may mint.
    function mint(address to, uint256 amount) external onlyOwner {
        if (supplyCap > 0 && totalSupply() + amount > supplyCap) {
            revert SupplyCapExceeded(totalSupply() + amount, supplyCap);
        }
        _mint(to, amount);
    }

    /// @notice Updates the supply cap. Pass 0 to remove the cap entirely.
    function setSupplyCap(uint256 newCap) external onlyOwner {
        emit SupplyCapUpdated(supplyCap, newCap);
        supplyCap = newCap;
    }

    /// @notice Updates the display decimals.
    /// @dev WARNING: This is cosmetic only. Existing balances are not rescaled.
    function setDecimals(uint8 newDecimals) external onlyOwner {
        emit DecimalsUpdated(_tokenDecimals, newDecimals);
        _tokenDecimals = newDecimals;
    }

    /// @notice Pauses all token transfers, mints, and burns.
    ///         Use as an emergency circuit-breaker; unpause to restore normal operation.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses token transfers, mints, and burns.
    function unpause() external onlyOwner {
        _unpause();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ERC-20 overrides
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns the number of decimal places used by XCAD.
    /// @dev Six decimals is common for fiat-backed stablecoins.
    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }

    /// @dev Blocks all transfers (including mints and burns) while paused.
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
