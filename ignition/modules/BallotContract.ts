import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BallotContractModule = buildModule("BallotContractModule", (m) => {
  const ballotContract = m.contract("BallotContract", [["Alice", "Bob", "Carol"]]);

  return { ballotContract };
});

export default BallotContractModule;
