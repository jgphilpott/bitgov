// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title HelloWorld
/// @notice A minimal Solidity contract — the starting point for BitGov's
///         exploration of decentralized digital democracy on Ethereum.
contract HelloWorld {
    string private _message;

    event MessageChanged(string newMessage);

    constructor(string memory initialMessage) {
        _message = initialMessage;
    }

    /// @notice Returns the current greeting message.
    function getMessage() external view returns (string memory) {
        return _message;
    }

    /// @notice Updates the greeting message.
    function setMessage(string memory newMessage) external {
        _message = newMessage;
        emit MessageChanged(newMessage);
    }
}
