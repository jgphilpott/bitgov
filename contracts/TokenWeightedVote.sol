// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title TokenWeightedVote
/// @notice A voting contract where influence is proportional to an address's
///         allocated governance-token balance — one token = one vote.
///         The owner allocates tokens to voters before or during the voting
///         period. Each token-holder may freely split their balance across as
///         many proposals as they like by calling vote() multiple times.
///
/// How to use:
///   1. Deploy with a list of proposal name strings.
///   2. Call allocateTokens() for each eligible voter to set their balance.
///   3. Token-holders call vote(proposalIndex, weight) to commit tokens.
///      A voter may call vote() multiple times to spread their tokens.
///   4. The owner calls closeVoting() when the poll ends.
///   5. Anyone may call winnerName() to read the result at any time.
contract TokenWeightedVote {

    // ─────────────────────────────────────────────────────────────────────────
    // Data structures
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Tracks the governance-token budget and spending of one address.
    struct Voter {
        uint256 balance; // total tokens allocated by the owner
        uint256 spent;   // tokens already committed to proposals (balance - spent = remaining)
    }

    /// @dev Represents one candidate proposal.
    struct Proposal {
        string  name;       // human-readable label supplied at deployment
        uint256 voteCount;  // cumulative token-weighted votes received so far
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State variables
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice The account that deployed the contract; can allocate tokens and
    ///         close voting.
    address public owner;

    /// @notice Running total of all governance tokens that have been allocated.
    ///         Equals the sum of every voter's balance.
    uint256 public totalSupply;

    /// @notice Mapping from an address to that address's Voter record.
    mapping(address => Voter) public voters;

    /// @notice Ordered list of competing proposals; indexed from zero.
    Proposal[] public proposals;

    /// @notice True once the owner calls closeVoting(); no further changes accepted.
    bool public votingClosed;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Emitted when the owner mints governance tokens to a voter's balance.
    event TokensAllocated(address indexed voter, uint256 amount);

    /// @dev Emitted when a voter commits tokens to a proposal.
    ///      weight is the number of tokens committed in this specific call.
    event VoteCast(address indexed voter, uint256 indexed proposalIndex, uint256 weight);

    /// @dev Emitted when the owner permanently closes the ballot.
    event VotingClosed();

    // ─────────────────────────────────────────────────────────────────────────
    // Custom errors
    // ─────────────────────────────────────────────────────────────────────────

    error NotOwner();           // caller is not the contract owner
    error InsufficientTokens(); // voter's remaining balance is less than the requested weight
    error InvalidProposal();    // proposal index is out of bounds
    error EmptyProposalList();  // deployment requires at least one proposal
    error ZeroWeight();         // committing zero tokens has no effect and is disallowed
    error VotingIsClosed();     // the owner has already closed the ballot

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Applied to functions that only the owner may call.
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @dev Applied to functions that must not run once voting is closed.
    modifier whileOpen() {
        if (votingClosed) revert VotingIsClosed();
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param proposalNames Array of proposal name strings to vote on.
    ///        Position in the array determines the zero-based index used in vote().
    constructor(string[] memory proposalNames) {
        if (proposalNames.length == 0) revert EmptyProposalList();

        owner = msg.sender; // the deploying account becomes the permanent owner

        // Populate the proposals array; every proposal starts with zero votes.
        for (uint256 i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({ name: proposalNames[i], voteCount: 0 }));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Owner actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Allocates `amount` governance tokens to `voter`.
    ///         Can be called multiple times — amounts are additive — so the
    ///         owner may top up a voter's balance at any point while voting is open.
    /// @param voter  The recipient address.
    /// @param amount Number of tokens to add to the voter's balance.
    function allocateTokens(address voter, uint256 amount) external onlyOwner whileOpen {
        voters[voter].balance += amount; // increase the individual voter's balance
        totalSupply           += amount; // track the aggregate tokens in circulation
        emit TokensAllocated(voter, amount);
    }

    /// @notice Permanently closes the ballot.
    ///         After this call no new allocations or votes are accepted and
    ///         the result is final.
    function closeVoting() external onlyOwner whileOpen {
        votingClosed = true;
        emit VotingClosed();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Voter actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Commits `weight` governance tokens to a proposal.
    ///
    ///         Unlike the BallotContract, a voter is not limited to one choice.
    ///         They may call vote() multiple times, distributing their tokens
    ///         across different proposals until their balance is exhausted.
    ///         This is known as *partial* or *split* voting.
    ///
    /// @param proposalIndex Zero-based index of the proposal to support.
    /// @param weight        Number of tokens to commit (must be > 0 and
    ///                      ≤ remaining unspent balance).
    function vote(uint256 proposalIndex, uint256 weight) external whileOpen {
        if (weight == 0)                       revert ZeroWeight();     // meaningless call guard
        if (proposalIndex >= proposals.length)  revert InvalidProposal();// bounds check

        Voter storage sender = voters[msg.sender]; // load the caller's record

        uint256 available = sender.balance - sender.spent; // how many tokens are still unspent
        if (weight > available) revert InsufficientTokens();// enforce the budget

        sender.spent                        += weight; // debit the voter's unspent balance
        proposals[proposalIndex].voteCount  += weight; // credit the proposal's running tally

        emit VoteCast(msg.sender, proposalIndex, weight);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns the number of unspent tokens still available to `voter`.
    function remainingTokens(address voter) external view returns (uint256) {
        return voters[voter].balance - voters[voter].spent;
    }

    /// @notice Returns the total number of proposals.
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /// @notice Returns the index of the proposal with the most token-weighted votes.
    ///         Ties are broken in favour of the earlier proposal (lower index).
    ///         This function can be called at any time; the result is only final
    ///         after closeVoting() has been called.
    function winningProposalIndex() public view returns (uint256 winningIndex) {
        uint256 best = 0; // highest token tally seen so far
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > best) {
                best         = proposals[i].voteCount;
                winningIndex = i;
            }
        }
        // winningIndex defaults to 0 if no votes have been cast yet.
    }

    /// @notice Convenience wrapper that returns the name of the winning proposal.
    function winnerName() external view returns (string memory) {
        return proposals[winningProposalIndex()].name;
    }
}
