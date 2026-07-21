import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BITGOVModule = buildModule("BITGOVModule", (m) => {
  const owner = m.getAccount(0);
  const bitgov = m.contract("BITGOV", [owner]);

  return { bitgov };
});

export default BITGOVModule;
