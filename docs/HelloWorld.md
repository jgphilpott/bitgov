# HelloWorld Contract

The `HelloWorld` contract is the classic starting point for BitGov. It stores a single greeting string on-chain and exposes functions to read and update it.

---

## Contract overview

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract HelloWorld {
    string private _message;

    event MessageChanged(string newMessage);

    constructor(string memory initialMessage) {
        _message = initialMessage;
    }

    function getMessage() external view returns (string memory) {
        return _message;
    }

    function setMessage(string memory newMessage) external {
        _message = newMessage;
        emit MessageChanged(newMessage);
    }
}
```

| Concept | Meaning |
|---|---|
| `pragma solidity ^0.8.28` | Specifies the minimum compiler version |
| `string private _message` | A state variable — stored permanently on-chain |
| `constructor(...)` | Runs once at deployment |
| `external view` | Read-only function; no gas cost when called off-chain |
| `emit MessageChanged(...)` | Fires an event — cheap, indexable log entry on the blockchain |

---

## Deploy

```bash
npx hardhat ignition deploy ignition/modules/HelloWorld.ts --network localhost
```

The deployment module passes `"Hello, World!"` as the initial message. Note the address printed at the end of the output — you will need it for the console session below.

---

## Interact via Hardhat console

### 1 — Start a local node (first terminal)

```bash
npx hardhat node
```

### 2 — Deploy (second terminal)

```bash
npx hardhat ignition deploy ignition/modules/HelloWorld.ts --network localhost
# Deployed HelloWorldModule#HelloWorld at 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3 — Open the Hardhat console

```bash
npx hardhat console --network localhost
```

### 4 — Import ethers

Hardhat v3 no longer injects globals into the console automatically.

```javascript
const { ethers } = await import("hardhat");
```

### 5 — Attach to the deployed contract

```javascript
const hw = await ethers.getContractAt("HelloWorld", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
```

### 6 — Read the current message

```javascript
await hw.getMessage();
// 'Hello, World!'
```

### 7 — Update the message

```javascript
await hw.setMessage("Hello, BitGov!");
await hw.getMessage();
// 'Hello, BitGov!'
```
