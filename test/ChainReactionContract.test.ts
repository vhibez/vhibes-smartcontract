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

  describe("Joining Challenges (Responses)", function () {
    it("Should allow user to join a challenge with text response", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");

      await expect(chainReactionContract.connect(user2).joinChallenge(1, 0, "My response", ""))
        .to.emit(chainReactionContract, "ChallengeJoined")
        .withArgs(user2.address, 1, 1, 0, "My response", "");

      const response = await chainReactionContract.getResponse(1);
      expect(response.responder).to.equal(user2.address);
      expect(response.responseText).to.equal("My response");
      expect(response.parentResponseId).to.equal(0);
      expect(response.exists).to.be.true;
    });

    it("Should allow user to join a challenge with image response", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "", "ipfs://response123");

      const response = await chainReactionContract.getResponse(1);
      expect(response.responseImageIpfsHash).to.equal("ipfs://response123");
    });

    it("Should allow user to join with both text and image", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "My response", "ipfs://response123");

      const response = await chainReactionContract.getResponse(1);
      expect(response.responseText).to.equal("My response");
      expect(response.responseImageIpfsHash).to.equal("ipfs://response123");
    });

    it("Should award points for joining a challenge", async function () {
      const { chainReactionContract, pointsContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");

      const pointsBefore = await pointsContract.getPoints(user2.address);
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Response", "");
      const pointsAfter = await pointsContract.getPoints(user2.address);

      expect(pointsAfter - pointsBefore).to.equal(10); // pointsPerResponse
    });

    it("Should track user responses", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Challenge 1", "");
      await chainReactionContract.connect(user1).startChallenge("Challenge 2", "");

      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Response 1", "");
      await chainReactionContract.connect(user2).joinChallenge(2, 0, "Response 2", "");

      const userResponses = await chainReactionContract.getUserResponses(user2.address);
      expect(userResponses.length).to.equal(2);
    });

    it("Should add response to challenge's response list", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Response 1", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Response 2", "");

      const responseCount = await chainReactionContract.getChallengeResponseCount(1);
      expect(responseCount).to.equal(2);
    });

    it("Should revert if challenge does not exist", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        chainReactionContract.connect(user1).joinChallenge(999, 0, "Response", "")
      ).to.be.revertedWith("Challenge does not exist");
    });

    it("Should revert if response is empty (no text and no image)", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");

      await expect(
        chainReactionContract.connect(user2).joinChallenge(1, 0, "", "")
      ).to.be.revertedWith("Response cannot be empty");
    });

    it("Should allow initiator to respond to their own challenge", async function () {
      const { chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await expect(chainReactionContract.connect(user1).joinChallenge(1, 0, "My own response", ""))
        .to.emit(chainReactionContract, "ChallengeJoined");
    });
  });

  describe("Nested Responses (Chain Structure)", function () {
    it("Should allow responding to a response (nested response)", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "First response", "");
      
      await expect(chainReactionContract.connect(user1).joinChallenge(1, 1, "Response to response", ""))
        .to.emit(chainReactionContract, "ChallengeJoined")
        .withArgs(user1.address, 1, 2, 1, "Response to response", "");

      const nestedResponse = await chainReactionContract.getResponse(2);
      expect(nestedResponse.parentResponseId).to.equal(1);
      expect(nestedResponse.challengeId).to.equal(1);
    });

    it("Should track child responses correctly", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Parent response", "");
      await chainReactionContract.connect(user1).joinChallenge(1, 1, "Child 1", "");
      await chainReactionContract.connect(user1).joinChallenge(1, 1, "Child 2", "");

      const childCount = await chainReactionContract.getResponseChildCount(1);
      expect(childCount).to.equal(2);
    });

    it("Should allow multi-level nesting", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Level 1", ""); // Response ID 1
      await chainReactionContract.connect(user1).joinChallenge(1, 1, "Level 2", ""); // Response ID 2
      await chainReactionContract.connect(user2).joinChallenge(1, 2, "Level 3", ""); // Response ID 3

      const level2Response = await chainReactionContract.getResponse(2);
      const level3Response = await chainReactionContract.getResponse(3);

      expect(level2Response.parentResponseId).to.equal(1);
      expect(level3Response.parentResponseId).to.equal(2);
    });

    it("Should revert if parent response does not exist", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");

      await expect(
        chainReactionContract.connect(user2).joinChallenge(1, 999, "Response", "")
      ).to.be.revertedWith("Parent response does not exist");
    });

    it("Should revert if parent response belongs to different challenge", async function () {
      const { chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Challenge 1", "");
      await chainReactionContract.connect(user1).startChallenge("Challenge 2", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Response to challenge 1", "");

      await expect(
        chainReactionContract.connect(user2).joinChallenge(2, 1, "Wrong parent", "")
      ).to.be.revertedWith("Parent response does not belong to this challenge");
    });

    it("Should award points for nested responses", async function () {
      const { chainReactionContract, pointsContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await chainReactionContract.connect(user1).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user2).joinChallenge(1, 0, "Parent", "");

      const pointsBefore = await pointsContract.getPoints(user1.address);
      await chainReactionContract.connect(user1).joinChallenge(1, 1, "Child", "");
      const pointsAfter = await pointsContract.getPoints(user1.address);

      // user1 already got points for creating challenge, now gets points for response
      expect(pointsAfter - pointsBefore).to.equal(10); // pointsPerResponse
    });
  });
});
