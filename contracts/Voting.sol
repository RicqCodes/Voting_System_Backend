// SPDX-License-Identifier: MIT

// Author: https://github.com/ricqcodes

pragma solidity 0.8.18;

import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/utils/Counters.sol';

contract Voting is AccessControl {

    // Create a new role identifier for the minter role
    bytes32 public constant PROPOSAL_ROLE = keccak256("PROPOSAL_ROLE");

    struct Proposal {
        address owner; 
        uint32 voteCount;
        bool isVotable;
        uint64 startTimestamp;
        uint64 endTimestamp;
        mapping(address => VoteChoice) votes;
    }

    enum VoteChoice {None, For, Against}

    mapping(bytes16 => Proposal) public proposals;
    mapping(address => mapping(bytes16 => bool)) public voters;

    event ProposalCreated(bytes16 indexed proposalId, uint64 _startTimestamp, uint64 _endTimestamp, address indexed creator);
    event VoteCasted(address indexed voter, bytes16 indexed proposalId, VoteChoice choice);
    event ProposalStopped(bytes16 indexed proposalId);

    constructor() {
     _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function voteProposal(bytes16 _proposalId, VoteChoice _choice) public {
        require(!voters[msg.sender][_proposalId], "Voter already voted for this proposal");
        require(proposals[_proposalId].isVotable, "Voting for this proposal stopped");
        require(block.timestamp > proposals[_proposalId].startTimestamp, "Voting has not started for this proposal" );
        require(block.timestamp < proposals[_proposalId].endTimestamp, "Proposal has ended");

        proposals[_proposalId].voteCount++;
        proposals[_proposalId].votes[msg.sender] = _choice;

        voters[msg.sender][_proposalId] = true;

        emit VoteCasted(msg.sender, _proposalId, _choice);
    }

    function createProposal(bytes32 _name, uint64 _startTimestamp, uint64 _endTimestamp) public {
        bytes16 proposalId = bytes16(_name);
        // require(!proposals[proposalId], 'Proposal Id already exists');
        require(hasRole(PROPOSAL_ROLE, msg.sender), "Caller is not authorized to create a proposal");
        require(_name.length <= 32, "String too long for conversion to bytes32");

        proposals[proposalId].owner = msg.sender; //21200 
        proposals[proposalId].isVotable = true; // packed with owner memory slot
        proposals[proposalId].startTimestamp = _startTimestamp; //21200
        proposals[proposalId].endTimestamp = _endTimestamp; //21200
        proposals[proposalId].voteCount = 0;
   
        emit ProposalCreated(proposalId, _startTimestamp, _endTimestamp, msg.sender);
    }

    function grantProposalRole(address _addr) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only the owner is authorized to grant roles");
        grantRole(PROPOSAL_ROLE, _addr);
    }

     function revokeProposalRole(address _address) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only the owner is authorized to grant roles");
        revokeRole(PROPOSAL_ROLE, _address);
    }

     function renounceProposalRole() public {
        renounceRole(PROPOSAL_ROLE, msg.sender);
    }

    function stopProposal(bytes16 _proposalId) public {
        if(!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
            require(proposals[_proposalId].owner == msg.sender, "Caller is not the owner of this proposal");
        }
        proposals[_proposalId].isVotable = false;
        emit ProposalStopped(_proposalId);
    }

    function getProposalVotes(bytes16 _proposalId, address _sender) public view returns(VoteChoice,bool) {
        return (proposals[_proposalId].votes[_sender], voters[msg.sender][_proposalId]);
    }
}

// 541975 - Gas spent by importing accesscontrol
// 1211119 - total gas to deploy
// 669144 - Contract gas usage.