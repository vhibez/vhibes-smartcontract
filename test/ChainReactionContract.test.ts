import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("ChainReactionContract", function () {
  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { chainReactionContract, pointsContract, badgesContract, owner } = await loadFixture(deployContractsFixture);

      expect(await chainReactionContract.owner()).to.equal(owner.address);
      expect(await chainReactionContract.pointsContract()).to.equal(await pointsContract.getAddress());
      expect(await chainReactionContract.badgesContract()).to.equal(await badgesContract.getAddress());
      expect(await chainReactionContract.pointsPerChallenge()).to.equal(20);
      expect(await chainReactionContract.pointsPerResponse()).to.equal(10);
    });

    it("Should set correct owner", async function () {
      const { chainReactionContract, owner } = await loadFixture(deployContractsFixture);

      expect(await chainReactionContract.owner()).to.equal(owner.address);
    });

    it("Should have zero challenges initially", async function () {
      const { chainReactionContract } = await loadFixture(deployContractsFixture);

      const activeChallenges = await chainReactionContract.getActiveChallenges(10);
      expect(activeChallenges.length).to.equal(0);
    });
  });

  describe("Challenge Creation", function () {
    it("Should create a challenge with text only", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(chainReactionContract.connect(user1).startChallenge("Test challenge", ""))
        .to.emit(chainReactionContract, "ChallengeStarted")
        .withArgs(user1.address, 1, "Test challenge", "");

      const challenge = await chainReactionContract.getChallenge(1);
      expect(challenge.initiator).to.equal(user1.address);
      expect(challenge.prompt).to.equal("Test challenge");
      expect(challenge.promptImageIpfsHash).to.equal("");
      expect(challenge.exists).to.be.true;
    });

    it("Should create a challenge with text and image", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(chainReactionContract.connect(user1).startChallenge("Test challenge", "ipfs://image123"))
        .to.emit(chainReactionContract, "ChallengeStarted")
        .withArgs(user1.address, 1, "Test challenge", "ipfs://image123");

      const challenge = await chainReactionContract.getChallenge(1);
      expect(challenge.promptImageIpfsHash).to.equal("ipfs://image123");
    });

    it("Should award points for creating a challenge", async function () {
      const { chainReactionContract, pointsContract, user1 } = await loadFixture(deployContractsFixture);

      const pointsBefore = await pointsContract.getPoints(user1.address);
      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      const pointsAfter = await pointsContract.getPoints(user1.address);

      expect(pointsAfter - pointsBefore).to.equal(20); // pointsPerChallenge
    });

    it("Should track user challenges", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Challenge 1", "");
      await chainReactionContract.connect(user1).startChallenge("Challenge 2", "");

      const userChallenges = await chainReactionContract.getUserChallenges(user1.address);
      expect(userChallenges.length).to.equal(2);
      expect(userChallenges[0]).to.equal(1);
      expect(userChallenges[1]).to.equal(2);
    });

    it("Should revert if prompt is empty and no image provided", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        chainReactionContract.connect(user1).startChallenge("", "")
      ).to.be.revertedWith("Challenge cannot be empty");
    });

    it("Should allow challenge with only image (no text)", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(chainReactionContract.connect(user1).startChallenge("", "ipfs://image123"))
        .to.emit(chainReactionContract, "ChallengeStarted");

      const challenge = await chainReactionContract.getChallenge(1);
      expect(challenge.prompt).to.equal("");
      expect(challenge.promptImageIpfsHash).to.equal("ipfs://image123");
    });

    it("Should increment challenge IDs correctly", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Challenge 1", "");
      await chainReactionContract.connect(user2).startChallenge("Challenge 2", "");
      await chainReactionContract.connect(user1).startChallenge("Challenge 3", "");

      const challenge1 = await chainReactionContract.getChallenge(1);
      const challenge2 = await chainReactionContract.getChallenge(2);
      const challenge3 = await chainReactionContract.getChallenge(3);

      expect(challenge1.initiator).to.equal(user1.address);
      expect(challenge2.initiator).to.equal(user2.address);
      expect(challenge3.initiator).to.equal(user1.address);
    });
  });
});
