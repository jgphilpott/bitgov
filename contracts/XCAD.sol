// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ERC20Burnable } from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/// @title XCAD
/// @notice A centrally issued ERC-20 token for a Canadian-dollar-pegged stablecoin.
///         The peg itself must be maintained off-chain through reserve management,
///         redemptions, and governance. On-chain, this contract provides controlled
///         issuance (owner-only minting) plus standard ERC-20 transfers and burning.
contract XCAD is ERC20, ERC20Burnable, Ownable {
    uint8 private constant TOKEN_DECIMALS = 6;

    /// @param initialOwner     Account allowed to mint additional XCAD.
    /// @param initialRecipient Account that receives the initial token supply.
    /// @param initialSupply    Number of base units minted at deployment.
    constructor(
        address initialOwner,
        address initialRecipient,
        uint256 initialSupply
    )
        ERC20("BitGov Canadian Dollar", "XCAD")
        Ownable(initialOwner)
    {
        if (initialSupply > 0) {
            _mint(initialRecipient, initialSupply);
        }
    }

    /// @notice Returns the number of decimal places used by XCAD.
    /// @dev Six decimals is common for fiat-backed stablecoins.
    function decimals() public pure override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    /// @notice Mints new XCAD to `to`.
    /// @dev Peg discipline is external to the contract; only the issuer may mint.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
