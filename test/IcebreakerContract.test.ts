import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("IcebreakerContract", function () {
  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { icebreakerContract, pointsContract, badgesContract, owner } = await loadFixture(deployContractsFixture);

      expect(await icebreakerContract.owner()).to.equal(owner.address);
      expect(await icebreakerContract.pointsContract()).to.equal(await pointsContract.getAddress());
      expect(await icebreakerContract.badgesContract()).to.equal(await badgesContract.getAddress());
      expect(await icebreakerContract.pointsPerPrompt()).to.equal(15);
      expect(await icebreakerContract.pointsPerResponse()).to.equal(5);
      expect(await icebreakerContract.pointsPerVote()).to.equal(1);
    });

    it("Should start with zero categories, prompts, and polls", async function () {
      const { icebreakerContract } = await loadFixture(deployContractsFixture);

      expect(await icebreakerContract.totalCategories()).to.equal(0);
      expect(await icebreakerContract.totalPrompts()).to.equal(0);
      expect(await icebreakerContract.totalPolls()).to.equal(0);
    });
  });

  describe("Category Management", function () {
    it("Should allow owner to create categories", async function () {
      const { icebreakerContract, owner } = await loadFixture(deployContractsFixture);

      await expect(icebreakerContract.connect(owner).createCategory("Fun", "Just for fun"))
        .to.emit(icebreakerContract, "CategoryCreated")
        .withArgs(1, "Fun", "Just for fun");

      const category = await icebreakerContract.getCategory(1);
      expect(category.name).to.equal("Fun");
      expect(category.description).to.equal("Just for fun");
      expect(category.exists).to.be.true;
    });

    it("Should revert if non-owner tries to create category", async function () {
      const { icebreakerContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        icebreakerContract.connect(user1).createCategory("Hacked", "Desc")
      ).to.be.revertedWithCustomError(icebreakerContract, "OwnableUnauthorizedAccount");
    });

    it("Should validate category existence", async function () {
      const { icebreakerContract, owner } = await loadFixture(deployContractsFixture);

      await icebreakerContract.connect(owner).createCategory("Tech", "Tech talks");
      expect(await icebreakerContract.categoryExists("Tech")).to.be.true;
      expect(await icebreakerContract.categoryExists("NonExistent")).to.be.false;
    });
  });

  describe("Prompts and Responses", function () {
    it("Should allow creating a prompt in an existing category", async function () {
      const { icebreakerContract, owner, user1 } = await loadFixture(deployContractsFixture);

      await icebreakerContract.connect(owner).createCategory("Fun", "Fun stuff");

      await expect(icebreakerContract.connect(user1).createPrompt("What is your hobby?", "Fun"))
        .to.emit(icebreakerContract, "PromptCreated")
        .withArgs(user1.address, 1, "What is your hobby?", "Fun");

      const prompt = await icebreakerContract.getPrompt(1);
      expect(prompt.creator).to.equal(user1.address);
      expect(prompt.text).to.equal("What is your hobby?");
      expect(prompt.category).to.equal("Fun");
      expect(prompt.exists).to.be.true;
    });

    it("Should revert if creating prompt in non-existent category", async function () {
      const { icebreakerContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(
        icebreakerContract.connect(user1).createPrompt("Question?", "GhostCategory")
      ).to.be.revertedWith("Category does not exist");
    });

    it("Should award points for creating a prompt", async function () {
      const { icebreakerContract, pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

      await icebreakerContract.connect(owner).createCategory("Fun", "Fun");
      
      const pointsBefore = await pointsContract.getPoints(user1.address);
      await icebreakerContract.connect(user1).createPrompt("Question?", "Fun");
      const pointsAfter = await pointsContract.getPoints(user1.address);

      expect(pointsAfter - pointsBefore).to.equal(15); // pointsPerPrompt
    });

    it("Should allow submitting a response to a prompt", async function () {
      const { icebreakerContract, owner, user1, user2 } = await loadFixture(deployContractsFixture);

      await icebreakerContract.connect(owner).createCategory("Fun", "Fun");
      await icebreakerContract.connect(user1).createPrompt("Question?", "Fun");

      await expect(icebreakerContract.connect(user2).submitResponse(1, "My answer", "ipfs://img"))
        .to.emit(icebreakerContract, "ResponseSubmitted")
        .withArgs(user2.address, 1, "My answer", "ipfs://img");

      const responses = await icebreakerContract.getResponses(1);
      expect(responses.length).to.equal(1);
      expect(responses[0].responder).to.equal(user2.address);
      expect(responses[0].responseText).to.equal("My answer");
    });

    it("Should award points for submitting a response", async function () {
      const { icebreakerContract, pointsContract, owner, user1, user2 } = await loadFixture(deployContractsFixture);

      await icebreakerContract.connect(owner).createCategory("Fun", "Fun");
      await icebreakerContract.connect(user1).createPrompt("Question?", "Fun");

      const pointsBefore = await pointsContract.getPoints(user2.address);
      await icebreakerContract.connect(user2).submitResponse(1, "Ans", "");
      const pointsAfter = await pointsContract.getPoints(user2.address);

      expect(pointsAfter - pointsBefore).to.equal(5); // pointsPerResponse
    });
  });
});
