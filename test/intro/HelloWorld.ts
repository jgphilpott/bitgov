import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("HelloWorld", function () {
  it("Should return the initial message set at deployment", async function () {
    const helloWorld = await ethers.deployContract("HelloWorld", [
      "Hello, World!",
    ]);

    expect(await helloWorld.getMessage()).to.equal("Hello, World!");
  });

  it("Should update the message and emit a MessageChanged event", async function () {
    const helloWorld = await ethers.deployContract("HelloWorld", [
      "Hello, World!",
    ]);

    await expect(helloWorld.setMessage("Hello, BitGov!"))
      .to.emit(helloWorld, "MessageChanged")
      .withArgs("Hello, BitGov!");

    expect(await helloWorld.getMessage()).to.equal("Hello, BitGov!");
  });
});
