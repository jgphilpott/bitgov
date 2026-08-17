import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const XCADModule = buildModule("XCADModule", (m) => {
  const owner = m.getAccount(0);
  const initialSupply = 1_000_000n * 10n ** 6n;

  const xcad = m.contract("XCAD", [owner, owner, initialSupply, 0n]);

  return { xcad };
});

export default XCADModule;
