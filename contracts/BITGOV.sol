// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import { ERC20Capped } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

/// @title BITGOV
/// @notice A scarce ERC-20 token with an immutable Bitcoin-style hard cap.
///         The full fixed supply is minted once at deployment and can never be
///         increased beyond the cap. Burning is allowed, which can only reduce
///         the circulating supply over time.
contract BITGOV is ERC20, ERC20Burnable, ERC20Capped {
    uint8 private constant TOKEN_DECIMALS = 8;
    uint256 public constant MAX_SUPPLY = 21_000_000 * 10 ** TOKEN_DECIMALS;

    /// @param initialRecipient Account that receives the full capped supply.
    constructor(address initialRecipient)
        ERC20("BitGov", "BITGOV")
        ERC20Capped(MAX_SUPPLY)
    {
        _mint(initialRecipient, MAX_SUPPLY);
    }

    /// @notice Returns the number of decimal places used by BITGOV.
    /// @dev Eight decimals mirrors Bitcoin's satoshi precision.
    function decimals() public pure override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}
