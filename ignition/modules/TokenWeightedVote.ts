import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokenWeightedVoteModule = buildModule("TokenWeightedVoteModule", (m) => {
  const tokenWeightedVote = m.contract("TokenWeightedVote", [
    ["Proposal A", "Proposal B", "Proposal C"],
  ]);

  return { tokenWeightedVote };
});

export default TokenWeightedVoteModule;
