import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";
import { createRequire } from "module";

// Resolve the bundled soljson.js from the `solc` devDependency so the
// compiler is available offline without downloading from soliditylang.org.
const require = createRequire(import.meta.url);
const solcPath: string = require.resolve("solc/soljson.js");

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        path: solcPath,
      },
    },
  },
});
