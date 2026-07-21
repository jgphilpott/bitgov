import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const HelloWorldModule = buildModule("HelloWorldModule", (m) => {
  const helloWorld = m.contract("HelloWorld", ["Hello, World!"]);

  return { helloWorld };
});

export default HelloWorldModule;
