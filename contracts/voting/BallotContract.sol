// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BallotContract
/// @notice A one-person-one-vote ballot. The chairperson registers eligible
///         voters, each of whom may cast exactly one vote (or delegate it to
///         another registered voter). Delegation weight accumulates so a chain
///         of delegations is fully counted in the final tally.
///
/// How to use:
///   1. Deploy with a list of proposal name strings.
///   2. Call registerVoter() (or registerVoters()) for each eligible address.
///   3. Registered voters call vote() or delegate() before voting is closed.
///   4. The chairperson calls closeVoting() when the poll ends.
///   5. Anyone may call winnerName() to read the result at any time.
contract BallotContract {

    // ─────────────────────────────────────────────────────────────────────────
    // Data structures
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Represents one registered voter.
    struct Voter {
        bool    registered; // true once the chairperson has authorised this address
        bool    voted;      // true after the voter casts a ballot or delegates
        address delegate;   // the address that ultimately holds this voter's weight
                            //   (address(0) means no delegation has been made)
        uint256 vote;       // zero-based index of the proposal this voter chose
        uint256 weight;     // voting power: 1 at registration; grows when others delegate here
    }

    /// @dev Represents one candidate proposal.
    struct Proposal {
        string  name;       // human-readable label supplied at deployment
        uint256 voteCount;  // accumulated weighted votes; increases as ballots are cast
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State variables
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice The account that deployed the contract; has exclusive rights to
    ///         register voters and close the ballot.
    address public chairperson;

    /// @notice Mapping from an address to that address's Voter record.
    ///         Reading voters[addr] returns the full Voter struct for addr.
    mapping(address => Voter) public voters;

    /// @notice Ordered list of competing proposals; each element is a Proposal struct.
    ///         Solidity auto-generates a getter: proposals(index) → (name, voteCount).
    Proposal[] public proposals;

    /// @notice True once the chairperson calls closeVoting(); no further changes accepted.
    bool public votingClosed;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Emitted when the chairperson grants voting rights to a new address.
    ///      Indexed on voter so it can be efficiently filtered off-chain.
    event VoterRegistered(address indexed voter);

    /// @dev Emitted when a voter casts their ballot directly.
    ///      Both the voter address and the chosen proposal index are indexed.
    event VoteCast(address indexed voter, uint256 indexed proposalIndex);

    /// @dev Emitted when a voter delegates their ballot to another address.
    ///      'to' is the final address in the delegation chain, not the direct target.
    event VoteDelegated(address indexed from, address indexed to);

    /// @dev Emitted when the chairperson permanently closes the ballot.
    event VotingClosed();

    // ─────────────────────────────────────────────────────────────────────────
    // Custom errors  (more gas-efficient than require() with strings)
    // ─────────────────────────────────────────────────────────────────────────

    error NotChairperson();    // caller is not the chairperson
    error AlreadyRegistered(); // address has already been granted voting rights
    error AlreadyVoted();      // voter has already cast or delegated their ballot
    error NotRegistered();     // address has not been granted voting rights
    error SelfDelegation();    // a voter cannot delegate their vote to themselves
    error DelegationLoop();    // following the delegation chain would create a cycle
    error InvalidProposal();   // proposal index is out of bounds
    error EmptyProposalList(); // deployment requires at least one proposal
    error VotingIsClosed();    // the chairperson has already closed the ballot

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Applied to functions that only the chairperson may call.
    ///      Reverts with NotChairperson if any other address tries.
    modifier onlyChairperson() {
        if (msg.sender != chairperson) revert NotChairperson();
        _; // continue executing the function body
    }

    /// @dev Applied to functions that must not run once voting is closed.
    ///      Reverts with VotingIsClosed if closeVoting() has been called.
    modifier whileOpen() {
        if (votingClosed) revert VotingIsClosed();
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    /// @param proposalNames Array of proposal name strings, e.g. ["Alice","Bob","Carol"].
    ///        The position in the array determines each proposal's zero-based index,
    ///        which is the value passed to vote().
    constructor(string[] memory proposalNames) {
        if (proposalNames.length == 0) revert EmptyProposalList();

        // The deploying address becomes the permanent chairperson.
        chairperson = msg.sender;

        // Iterate over the supplied names and push one Proposal into storage per name.
        // voteCount starts at zero for every proposal.
        for (uint256 i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({ name: proposalNames[i], voteCount: 0 }));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chairperson actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Grants voting rights to a single address.
    ///         Every registered voter starts with a weight of 1.
    /// @param voter The address to authorise; must not already be registered.
    function registerVoter(address voter) external onlyChairperson whileOpen {
        if (voters[voter].registered) revert AlreadyRegistered();
        voters[voter].registered = true; // mark this address as eligible to vote
        voters[voter].weight     = 1;    // one person = one vote at the start
        emit VoterRegistered(voter);
    }

    /// @notice Registers multiple voters in a single transaction.
    ///         Addresses that are already registered are silently skipped
    ///         (no revert) so the call is safe to call with partial lists.
    /// @param voterList Array of addresses to authorise.
    function registerVoters(address[] calldata voterList) external onlyChairperson whileOpen {
        for (uint256 i = 0; i < voterList.length; i++) {
            address v = voterList[i];
            if (!voters[v].registered) {   // skip duplicates without reverting
                voters[v].registered = true;
                voters[v].weight     = 1;
                emit VoterRegistered(v);
            }
        }
    }

    /// @notice Permanently closes the ballot.
    ///         After this call no new votes, delegations, or registrations
    ///         are accepted. The result is then final.
    function closeVoting() external onlyChairperson whileOpen {
        votingClosed = true;
        emit VotingClosed();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Voter actions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Delegates your entire voting weight to `to`.
    ///         The function walks the full delegation chain from `to` to its
    ///         end so that your weight lands with whoever will ultimately vote.
    ///         If the end of the chain has already voted, the proposal tally is
    ///         updated immediately; otherwise the weight is banked for later.
    ///
    /// @dev    Storing the *final* delegate (not the direct target) in
    ///         sender.delegate keeps the chain flat and prevents gas blowup on
    ///         long chains.  The loop also detects cycles before they form.
    ///
    /// @param to The address you wish to delegate to (need not be the final holder).
    function delegate(address to) external whileOpen {
        Voter storage sender = voters[msg.sender]; // load caller's record from storage

        if (!sender.registered) revert NotRegistered(); // only registered voters may delegate
        if (sender.voted)       revert AlreadyVoted();  // cannot delegate after already voting
        if (to == msg.sender)   revert SelfDelegation();// delegating to yourself is meaningless
        if (!voters[to].registered) revert NotRegistered();

        // Walk the existing delegation chain starting at `to`.
        // We follow each node's .delegate field until we reach someone who
        // has not yet delegated (their .delegate is still address(0)).
        address current = to;
        while (voters[current].delegate != address(0)) {
            current = voters[current].delegate;          // advance one hop
            if (current == msg.sender) revert DelegationLoop(); // cycle detected
        }
        // `current` is now the final, non-delegating address in the chain.

        sender.voted    = true;    // mark caller as "voted" to prevent a second action
        sender.delegate = current; // record the ultimate holder of our weight

        Voter storage finalDelegate = voters[current];

        if (finalDelegate.voted) {
            // The end of the chain already voted — add our weight directly to
            // the proposal they chose so no tokens are left unaccounted for.
            proposals[finalDelegate.vote].voteCount += sender.weight;
        } else {
            // The end of the chain has not voted yet — increase their weight
            // so when they call vote() our weight is included automatically.
            finalDelegate.weight += sender.weight;
        }

        emit VoteDelegated(msg.sender, current);
    }

    /// @notice Casts your ballot for a proposal.
    ///         Your entire current weight (your own vote plus any delegations
    ///         you have received) is added to the chosen proposal's tally.
    ///
    /// @param proposalIndex Zero-based index of the proposal to vote for.
    ///        Use proposalCount() to check how many proposals exist.
    function vote(uint256 proposalIndex) external whileOpen {
        Voter storage sender = voters[msg.sender];

        if (!sender.registered)               revert NotRegistered();  // must be authorised
        if (sender.voted)                     revert AlreadyVoted();   // cannot vote twice
        if (proposalIndex >= proposals.length) revert InvalidProposal();// bounds check

        sender.voted = true;            // lock the ballot so this voter cannot vote again
        sender.vote  = proposalIndex;   // remember the choice so delegators' late tokens land here

        // Add the voter's full weight.  weight > 1 means others delegated to this address
        // before this vote was cast (see delegate() above).
        proposals[proposalIndex].voteCount += sender.weight;

        emit VoteCast(msg.sender, proposalIndex);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View / pure functions
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Returns the number of proposals in the ballot.
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /// @notice Returns the index of the proposal with the highest vote tally.
    ///         Ties are broken in favour of the earlier proposal (lower index).
    ///         This function can be called at any time; the result is only final
    ///         after closeVoting() has been called.
    function winningProposalIndex() public view returns (uint256 winningIndex) {
        uint256 best = 0; // highest vote count encountered so far
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > best) {
                best         = proposals[i].voteCount; // new leader
                winningIndex = i;                      // record its index
            }
        }
        // winningIndex defaults to 0 if no votes have been cast yet.
    }

    /// @notice Convenience wrapper that returns the name of the winning proposal.
    function winnerName() external view returns (string memory) {
        return proposals[winningProposalIndex()].name;
    }
}
