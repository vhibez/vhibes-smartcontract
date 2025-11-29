import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("RoastMeContract", function () {
  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { roastContract, pointsContract, badgesContract, owner } = await loadFixture(deployContractsFixture);

      expect(await roastContract.owner()).to.equal(owner.address);
      expect(await roastContract.pointsContract()).to.equal(await pointsContract.getAddress());
      expect(await roastContract.badgesContract()).to.equal(await badgesContract.getAddress());
      expect(await roastContract.pointsPerRoast()).to.equal(10);
      expect(await roastContract.pointsPerVote()).to.equal(1);
      expect(await roastContract.pointsPerFunnyVote()).to.equal(5);
    });

    it("Should have zero roasts initially", async function () {
      const { roastContract } = await loadFixture(deployContractsFixture);

      const totalRoasts = await roastContract.totalRoasts();
      expect(totalRoasts).to.equal(0);
    });
  });

  describe("Roast Submission", function () {
    it("Should submit a roast with valid inputs", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast"))
        .to.emit(roastContract, "RoastSubmitted")
        .withArgs(user1.address, 1, "ipfs://original", "ipfs://roast");

      const roast = await roastContract.getRoast(1);
      expect(roast.submitter).to.equal(user1.address);
      expect(roast.originalImageIpfsHash).to.equal("ipfs://original");
      expect(roast.roastIpfsHash).to.equal("ipfs://roast");
      expect(roast.funnyVotes).to.equal(0);
      expect(roast.mehVotes).to.equal(0);
      expect(roast.exists).to.be.true;
    });

    it("Should award points for submitting a roast", async function () {
      const { roastContract, pointsContract, user1 } = await loadFixture(deployContractsFixture);

      const pointsBefore = await pointsContract.getPoints(user1.address);
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      const pointsAfter = await pointsContract.getPoints(user1.address);

      expect(pointsAfter - pointsBefore).to.equal(10); // pointsPerRoast
    });

    it("Should track user roasts", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      await roastContract.connect(user1).submitRoast("ipfs://1", "ipfs://1");
      await roastContract.connect(user1).submitRoast("ipfs://2", "ipfs://2");

      const userRoasts = await roastContract.getUserRoasts(user1.address);
      expect(userRoasts.length).to.equal(2);
      expect(userRoasts[0]).to.equal(1);
      expect(userRoasts[1]).to.equal(2);
    });

    it("Should revert if original image hash is empty", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        roastContract.connect(user1).submitRoast("", "ipfs://roast")
      ).to.be.revertedWith("Invalid original image hash");
    });

    it("Should revert if roast hash is empty", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        roastContract.connect(user1).submitRoast("ipfs://original", "")
      ).to.be.revertedWith("Invalid roast hash");
    });
  });

  describe("Voting Functionality", function () {
    it("Should allow voting funny on a roast", async function () {
      const { roastContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      
      await expect(roastContract.connect(user2).voteRoast(1, true))
        .to.emit(roastContract, "RoastVoted")
        .withArgs(user2.address, 1, true);

      const roast = await roastContract.getRoast(1);
      expect(roast.funnyVotes).to.equal(1);
      expect(roast.mehVotes).to.equal(0);
    });

    it("Should allow voting meh on a roast", async function () {
      const { roastContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      
      await expect(roastContract.connect(user2).voteRoast(1, false))
        .to.emit(roastContract, "RoastVoted")
        .withArgs(user2.address, 1, false);

      const roast = await roastContract.getRoast(1);
      expect(roast.funnyVotes).to.equal(0);
      expect(roast.mehVotes).to.equal(1);
    });

    it("Should prevent double voting", async function () {
      const { roastContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      await roastContract.connect(user2).voteRoast(1, true);

      await expect(
        roastContract.connect(user2).voteRoast(1, false)
      ).to.be.revertedWith("Already voted on this roast");
    });

    it("Should prevent self-voting", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");

      await expect(
        roastContract.connect(user1).voteRoast(1, true)
      ).to.be.revertedWith("Cannot vote on your own roast");
    });

    it("Should award points correctly for funny vote", async function () {
      const { roastContract, pointsContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // User1 submits
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      
      const submitterPointsBefore = await pointsContract.getPoints(user1.address);
      const voterPointsBefore = await pointsContract.getPoints(user2.address);

      // User2 votes funny
      await roastContract.connect(user2).voteRoast(1, true);

      const submitterPointsAfter = await pointsContract.getPoints(user1.address);
      const voterPointsAfter = await pointsContract.getPoints(user2.address);

      // Voter gets 1 point
      expect(voterPointsAfter - voterPointsBefore).to.equal(1);
      // Submitter gets 5 points (bonus for funny)
      expect(submitterPointsAfter - submitterPointsBefore).to.equal(5);
    });

    it("Should award points correctly for meh vote", async function () {
      const { roastContract, pointsContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // User1 submits
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      
      const submitterPointsBefore = await pointsContract.getPoints(user1.address);
      const voterPointsBefore = await pointsContract.getPoints(user2.address);

      // User2 votes meh
      await roastContract.connect(user2).voteRoast(1, false);

      const submitterPointsAfter = await pointsContract.getPoints(user1.address);
      const voterPointsAfter = await pointsContract.getPoints(user2.address);

      // Voter gets 1 point
      expect(voterPointsAfter - voterPointsBefore).to.equal(1);
      // Submitter gets 0 points for meh
      expect(submitterPointsAfter - submitterPointsBefore).to.equal(0);
    });

    it("Should track user votes correctly", async function () {
      const { roastContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      await roastContract.connect(user2).voteRoast(1, true);

      expect(await roastContract.hasUserVoted(user2.address, 1)).to.be.true;
      expect(await roastContract.getUserVote(user2.address, 1)).to.be.true; // true = funny
    });

    it("Should revert if voting on non-existent roast", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        roastContract.connect(user1).voteRoast(999, true)
      ).to.be.revertedWith("Roast does not exist");
    });
  });

  describe("Ranking and Leaderboards", function () {


    it("Should correctly sort roasts by funny votes", async function () {
      const { roastContract, user1, user2, admin } = await loadFixture(deployContractsFixture);
      // We need more signers for voting
      const signers = await ethers.getSigners();
      const voters = signers.slice(4, 10); // get extra signers

      // Create roasts
      await roastContract.connect(user1).submitRoast("ipfs://1", "ipfs://1"); // ID 1
      await roastContract.connect(user1).submitRoast("ipfs://2", "ipfs://2"); // ID 2
      await roastContract.connect(user1).submitRoast("ipfs://3", "ipfs://3"); // ID 3

      // Roast 2 gets 2 votes
      await roastContract.connect(user2).voteRoast(2, true);
      await roastContract.connect(admin).voteRoast(2, true);

      // Roast 3 gets 1 vote
      await roastContract.connect(user2).voteRoast(3, true);

      // Roast 1 gets 0 votes

      const topRoasts = await roastContract.getTopRoasts(10);
      
      expect(topRoasts[0]).to.equal(2); // Most votes
      expect(topRoasts[1]).to.equal(3); // Second most
      expect(topRoasts[2]).to.equal(1); // Least
    });

    it("Should return top roasters sorted by submission count", async function () {
      const { roastContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // User1 submits 3 roasts
      await roastContract.connect(user1).submitRoast("1", "1");
      await roastContract.connect(user1).submitRoast("2", "2");
      await roastContract.connect(user1).submitRoast("3", "3");

      // User2 submits 1 roast
      await roastContract.connect(user2).submitRoast("4", "4");

      const [topUsers, topCounts] = await roastContract.getTopRoasters(10);

      expect(topUsers[0]).to.equal(user1.address);
      expect(topCounts[0]).to.equal(3);
      
      expect(topUsers[1]).to.equal(user2.address);
      expect(topCounts[1]).to.equal(1);
    });

    it("Should respect limits in ranking functions", async function () {
      const { roastContract, user1 } = await loadFixture(deployContractsFixture);

      for(let i = 0; i < 5; i++) {
        await roastContract.connect(user1).submitRoast(`${i}`, `${i}`);
      }

      const topRoasts = await roastContract.getTopRoasts(3);
      expect(topRoasts.length).to.equal(3);

      const [topUsers, topCounts] = await roastContract.getTopRoasters(3);
      expect(topUsers.length).to.equal(1); // Only 1 user submitted
    });

    it("Should revert if limits are too high", async function () {
      const { roastContract } = await loadFixture(deployContractsFixture);

      await expect(roastContract.getTopRoasts(51)).to.be.revertedWith("Limit too high");
      await expect(roastContract.getTopRoasters(101)).to.be.revertedWith("Limit too high");
    });
  });
});
