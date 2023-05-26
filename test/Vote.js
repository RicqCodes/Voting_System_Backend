const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vote", () => {
  const deployVote = async () => {
    const [owner, proposal, others] = await ethers.getSigners();
    const Vote = await ethers.getContractFactory("Voting");
    const vote = await Vote.deploy();
    return { vote, owner, proposal, others };
  };

  describe("Deployment", async () => {
    it("Should return the deployer as admin role", async () => {
      const { vote, owner } = await loadFixture(deployVote);
      const ADMIN = await vote.DEFAULT_ADMIN_ROLE();
      expect(await vote.hasRole(ADMIN, owner.address)).to.true;
    });
  });

  describe("Access Control", async () => {
    it("Should set correct role", async () => {
      const { vote, owner, proposal, others } = await loadFixture(deployVote);
      const PROPOSAL_ROLE = await vote.PROPOSAL_ROLE();
      expect(await vote.grantProposalRole(proposal.address))
        .to.emit(vote, "RoleGranted")
        .withArgs(PROPOSAL_ROLE, proposal.address, owner.address);
      expect(await vote.hasRole(PROPOSAL_ROLE, proposal.address)).to.be.true;
    });

    it("Should revoke the role", async () => {
      const { vote, owner, proposal } = await loadFixture(deployVote);
      await vote.grantProposalRole(proposal.address);
      const PROPOSAL_ROLE = await vote.PROPOSAL_ROLE();

      expect(await vote.revokeProposalRole(proposal.address))
        .to.emit(vote, "RoleRevoked")
        .withArgs(PROPOSAL_ROLE, proposal.address, owner.address);
      expect(await vote.hasRole(PROPOSAL_ROLE, proposal.address)).to.be.false;
    });

    it("Should revert if non-role admin calls to grant or revoke role", async () => {
      const { vote, owner, proposal } = await loadFixture(deployVote);
      await expect(
        vote.connect(proposal).grantProposalRole(owner.address)
      ).to.be.revertedWith(
        new RegExp(
          "AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})"
        )
      );
      await expect(
        vote.connect(proposal).grantProposalRole(owner.address)
      ).to.be.revertedWith(
        new RegExp(
          "AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})"
        )
      );
    });
  });

  describe("Business Logic", async () => {
    it("Should allow PROPOSAL_ROLE create proposal", async () => {
      const { vote, owner, proposal } = await loadFixture(deployVote);
      await vote.grantProposalRole(proposal.address);
      const name = ethers.utils.formatBytes32String("First Proposal");
      expect(await vote.connect(proposal).createProposal(name)).to.emit(
        vote,
        "ProposalCreated"
      );
    });

    it("Should allow user to vote on a proposal", async () => {
      const { vote, owner, proposal, others } = await loadFixture(deployVote);
      await vote.grantProposalRole(proposal.address);
      const name = ethers.utils.formatBytes32String("First Proposal");
      await vote.connect(proposal).createProposal(name);
      const myProposal = await vote.proposals(
        ethers.utils.formatBytes32String("First Proposal").slice(0, 34)
      );

      const proposalId = myProposal.proposalId;
      expect(await vote.connect(others).voteProposal(proposalId, 1));
    });

    it("Should revert if user try to vote on same proposal twice", async () => {
      const { vote, proposal, others } = await loadFixture(deployVote);
      await vote.grantProposalRole(proposal.address);
      const name = ethers.utils.formatBytes32String("First Proposal");
      await vote.connect(proposal).createProposal(name);
      const myProposal = await vote.proposals(
        ethers.utils.formatBytes32String("First Proposal").slice(0, 34)
      );

      const proposalId = myProposal.proposalId;
      vote.connect(others).voteProposal(proposalId, 1);
      expect(
        await vote.connect(others).voteProposal(proposalId, 1)
      ).to.be.revertedWith(
        new RegExp(
          "VoteProposal: account (0x[0-9a-f]{40}) is voting on the same proposal twice (0x[0-9a-f]{64})"
        )
      );
    });

    it("Should revert for caller without correct role", async function () {
      const { vote, proposal, others } = await loadFixture(deployVote);
      await vote.grantProposalRole(proposal.address);
      const name = ethers.utils.formatBytes32String("First Proposal");

      await expect(
        vote.connect(others).createProposal(name)
      ).to.be.revertedWith(
        new RegExp(
          "AccessControl: account (0x[0-9a-f]{40}) is missing role (0x[0-9a-f]{64})"
        )
      );
      c;
    });
  });
});
