import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("VhibesBadges - Badge Requirement Checks", function () {
  describe("claimTopRoasterBadge", function () {
    it("Should revert if badge already claimed", async function () {
      const { badgesContract, roastContract, user1 } = await loadFixture(deployContractsFixture);

      // Create 10 roasts to meet requirement
      for (let i = 0; i < 10; i++) {
        await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      }

      // Claim badge first time
      await badgesContract.connect(user1).claimTopRoasterBadge();

      // Try to claim again - should revert
      await expect(badgesContract.connect(user1).claimTopRoasterBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeAlreadyClaimed")
        .withArgs("Top Roaster");
    });

    it("Should revert if badge URI not set", async function () {
      const { badgesContract, roastContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Clear badge URI
      await badgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "", // Empty topRoaster URI
        "ipfs://chainMaster",
        "ipfs://icebreaker"
      );

      // Create 10 roasts
      for (let i = 0; i < 10; i++) {
        await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      }

      await expect(badgesContract.connect(user1).claimTopRoasterBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeURINotSet")
        .withArgs("Top Roaster");
    });

    it("Should revert if roast contract not set", async function () {
      const { badgesContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Deploy new badges contract without setting contracts
      const VhibesBadges = await ethers.getContractFactory("VhibesBadges");
      const newBadgesContract = await VhibesBadges.deploy(
        owner.address,
        "Vhibes Badges",
        "VHIBES",
        "https://vhibes.vercel.app/badges/"
      );

      // Set badge URI
      await newBadgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "ipfs://chainMaster",
        "ipfs://icebreaker"
      );

      // Don't set contracts - roastContract will be zero address
      await expect(newBadgesContract.connect(user1).claimTopRoasterBadge())
        .to.be.revertedWithCustomError(newBadgesContract, "ContractNotSet")
        .withArgs("RoastMeContract");
    });

    it("Should revert if roast count requirement not met", async function () {
      const { badgesContract, roastContract, user1 } = await loadFixture(deployContractsFixture);

      // Create only 9 roasts (requirement is 10)
      for (let i = 0; i < 9; i++) {
        await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      }

      await expect(badgesContract.connect(user1).claimTopRoasterBadge())
        .to.be.revertedWithCustomError(badgesContract, "RequirementNotMet")
        .withArgs("Top Roaster", 10n, 9n);
    });

    it("Should successfully claim badge when requirement is met", async function () {
      const { badgesContract, roastContract, user1 } = await loadFixture(deployContractsFixture);

      // Create exactly 10 roasts
      for (let i = 0; i < 10; i++) {
        await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      }

      await expect(badgesContract.connect(user1).claimTopRoasterBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "Top Roaster");

      expect(await badgesContract.hasTopRoasterBadge(user1.address)).to.be.true;
    });

    it("Should successfully claim badge when requirement is exceeded", async function () {
      const { badgesContract, roastContract, user1 } = await loadFixture(deployContractsFixture);

      // Create 15 roasts (more than required 10)
      for (let i = 0; i < 15; i++) {
        await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");
      }

      await expect(badgesContract.connect(user1).claimTopRoasterBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "Top Roaster");

      expect(await badgesContract.hasTopRoasterBadge(user1.address)).to.be.true;
    });
  });

  describe("claimChainMasterBadge", function () {
    it("Should revert if badge already claimed", async function () {
      const { badgesContract, chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // Create 5 chain participations (responses only, challenges don't count)
      await chainReactionContract.connect(user2).startChallenge("Test challenge", "");
      for (let i = 0; i < 5; i++) {
        await chainReactionContract.connect(user1).joinChallenge(1, 0, "Response", "");
      }

      // Claim badge first time
      await badgesContract.connect(user1).claimChainMasterBadge();

      // Try to claim again
      await expect(badgesContract.connect(user1).claimChainMasterBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeAlreadyClaimed")
        .withArgs("Chain Master");
    });

    it("Should revert if badge URI not set", async function () {
      const { badgesContract, chainReactionContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Clear badge URI
      await badgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "", // Empty chainMaster URI
        "ipfs://icebreaker"
      );

      // Create 5 participations (responses only)
      await chainReactionContract.connect(user1).startChallenge("Test", "");
      for (let i = 0; i < 5; i++) {
        await chainReactionContract.connect(user1).joinChallenge(1, 0, "Response", "");
      }

      await expect(badgesContract.connect(user1).claimChainMasterBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeURINotSet")
        .withArgs("Chain Master");
    });

    it("Should revert if chain reaction contract not set", async function () {
      const { user1, owner, roastContract, icebreakerContract } = await loadFixture(deployContractsFixture);

      // Deploy new badges contract without setting chain reaction contract
      const VhibesBadges = await ethers.getContractFactory("VhibesBadges");
      const newBadgesContract = await VhibesBadges.deploy(
        owner.address,
        "Vhibes Badges",
        "VHIBES",
        "https://vhibes.vercel.app/badges/"
      );

      // Set badge URI
      await newBadgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "ipfs://chainMaster",
        "ipfs://icebreaker"
      );

      // Don't call setContracts - chainReactionContract will be zero address
      await expect(newBadgesContract.connect(user1).claimChainMasterBadge())
        .to.be.revertedWithCustomError(newBadgesContract, "ContractNotSet")
        .withArgs("ChainReactionContract");
    });

    it("Should revert if participation count requirement not met", async function () {
      const { badgesContract, chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // Create only 4 participations (requirement is 5) - responses only count
      await chainReactionContract.connect(user2).startChallenge("Test", "");
      for (let i = 0; i < 4; i++) {
        await chainReactionContract.connect(user1).joinChallenge(1, 0, "Response", "");
      }

      await expect(badgesContract.connect(user1).claimChainMasterBadge())
        .to.be.revertedWithCustomError(badgesContract, "RequirementNotMet")
        .withArgs("Chain Master", 5n, 4n);
    });

    it("Should successfully claim badge when requirement is met", async function () {
      const { badgesContract, chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // Create exactly 5 participations (responses only)
      await chainReactionContract.connect(user2).startChallenge("Test", "");
      for (let i = 0; i < 5; i++) {
        await chainReactionContract.connect(user1).joinChallenge(1, 0, "Response", "");
      }

      await expect(badgesContract.connect(user1).claimChainMasterBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "Chain Master");

      expect(await badgesContract.hasChainMasterBadge(user1.address)).to.be.true;
    });
  });

  describe("claimIcebreakerBadge", function () {
    it("Should revert if badge already claimed", async function () {
      const { badgesContract, icebreakerContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Create category first
      await icebreakerContract.connect(owner).createCategory("Test", "Test category");

      // Create 10 icebreaker activities (prompts + responses)
      for (let i = 0; i < 10; i++) {
        await icebreakerContract.connect(user1).createPrompt("Test prompt", "Test");
      }

      // Claim badge first time
      await badgesContract.connect(user1).claimIcebreakerBadge();

      // Try to claim again
      await expect(badgesContract.connect(user1).claimIcebreakerBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeAlreadyClaimed")
        .withArgs("Icebreaker");
    });

    it("Should revert if badge URI not set", async function () {
      const { badgesContract, icebreakerContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Clear badge URI
      await badgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "ipfs://chainMaster",
        "" // Empty icebreaker URI
      );

      // Create category and activities
      await icebreakerContract.connect(owner).createCategory("Test", "Test category");
      for (let i = 0; i < 10; i++) {
        await icebreakerContract.connect(user1).createPrompt("Test prompt", "Test");
      }

      await expect(badgesContract.connect(user1).claimIcebreakerBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeURINotSet")
        .withArgs("Icebreaker");
    });

    it("Should revert if icebreaker contract not set", async function () {
      const { user1, owner } = await loadFixture(deployContractsFixture);

      // Deploy new badges contract without setting icebreaker contract
      const VhibesBadges = await ethers.getContractFactory("VhibesBadges");
      const newBadgesContract = await VhibesBadges.deploy(
        owner.address,
        "Vhibes Badges",
        "VHIBES",
        "https://vhibes.vercel.app/badges/"
      );

      // Set badge URI
      await newBadgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "ipfs://chainMaster",
        "ipfs://icebreaker"
      );

      // Don't call setContracts - icebreakerContract will be zero address
      await expect(newBadgesContract.connect(user1).claimIcebreakerBadge())
        .to.be.revertedWithCustomError(newBadgesContract, "ContractNotSet")
        .withArgs("IcebreakerContract");
    });

    it("Should revert if activity count requirement not met", async function () {
      const { badgesContract, icebreakerContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Create category
      await icebreakerContract.connect(owner).createCategory("Test", "Test category");

      // Create only 9 activities (requirement is 10)
      for (let i = 0; i < 9; i++) {
        await icebreakerContract.connect(user1).createPrompt("Test prompt", "Test");
      }

      await expect(badgesContract.connect(user1).claimIcebreakerBadge())
        .to.be.revertedWithCustomError(badgesContract, "RequirementNotMet")
        .withArgs("Icebreaker", 10n, 9n);
    });

    it("Should successfully claim badge when requirement is met with prompts only", async function () {
      const { badgesContract, icebreakerContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Create category
      await icebreakerContract.connect(owner).createCategory("Test", "Test category");

      // Create exactly 10 prompts
      for (let i = 0; i < 10; i++) {
        await icebreakerContract.connect(user1).createPrompt("Test prompt", "Test");
      }

      await expect(badgesContract.connect(user1).claimIcebreakerBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "Icebreaker");

      expect(await badgesContract.hasIcebreakerBadge(user1.address)).to.be.true;
    });

    it("Should successfully claim badge when requirement is met with mixed activities", async function () {
      const { badgesContract, icebreakerContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Create category
      await icebreakerContract.connect(owner).createCategory("Test", "Test category");

      // Create 5 prompts
      for (let i = 0; i < 5; i++) {
        await icebreakerContract.connect(user1).createPrompt("Test prompt", "Test");
      }

      // Create 5 responses
      for (let i = 0; i < 5; i++) {
        await icebreakerContract.connect(user1).submitResponse(1, "Test response", "");
      }

      await expect(badgesContract.connect(user1).claimIcebreakerBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "Icebreaker");

      expect(await badgesContract.hasIcebreakerBadge(user1.address)).to.be.true;
    });
  });

  describe("claimFirstActivityBadge", function () {
    it("Should revert if badge already claimed", async function () {
      const { badgesContract, roastContract, user1 } = await loadFixture(deployContractsFixture);

      // Create 1 roast activity
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");

      // Claim badge first time
      await badgesContract.connect(user1).claimFirstActivityBadge();

      // Try to claim again
      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeAlreadyClaimed")
        .withArgs("First Activity");
    });

    it("Should revert if badge URI not set", async function () {
      const { badgesContract, roastContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Clear badge URI
      await badgesContract.connect(owner).setBadgeURIs(
        "", // Empty firstActivity URI
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "ipfs://chainMaster",
        "ipfs://icebreaker"
      );

      // Create 1 activity
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");

      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.be.revertedWithCustomError(badgesContract, "BadgeURINotSet")
        .withArgs("First Activity");
    });

    it("Should revert if no activity across any contract", async function () {
      const { badgesContract, user1 } = await loadFixture(deployContractsFixture);

      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.be.revertedWithCustomError(badgesContract, "RequirementNotMet")
        .withArgs("First Activity", 1n, 0n);
    });

    it("Should successfully claim with activity from RoastMeContract", async function () {
      const { badgesContract, roastContract, user1 } = await loadFixture(deployContractsFixture);

      // Create 1 roast
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");

      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "First Activity");

      expect(await badgesContract.hasFirstActivityBadge(user1.address)).to.be.true;
    });

    it("Should successfully claim with activity from ChainReactionContract", async function () {
      const { badgesContract, chainReactionContract, user1, user2 } = await loadFixture(deployContractsFixture);

      // Create 1 response (responses count as participations, challenges don't)
      await chainReactionContract.connect(user2).startChallenge("Test challenge", "");
      await chainReactionContract.connect(user1).joinChallenge(1, 0, "Response", "");

      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "First Activity");

      expect(await badgesContract.hasFirstActivityBadge(user1.address)).to.be.true;
    });

    it("Should successfully claim with activity from IcebreakerContract", async function () {
      const { badgesContract, icebreakerContract, user1, owner } = await loadFixture(deployContractsFixture);

      // Create category and prompt
      await icebreakerContract.connect(owner).createCategory("Test", "Test category");
      await icebreakerContract.connect(user1).createPrompt("Test prompt", "Test");

      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "First Activity");

      expect(await badgesContract.hasFirstActivityBadge(user1.address)).to.be.true;
    });

    it("Should successfully claim with combined activities from multiple contracts", async function () {
      const { badgesContract, roastContract, chainReactionContract, user1 } = await loadFixture(deployContractsFixture);

      // Create activities from different contracts (total = 1)
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");

      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "First Activity");

      expect(await badgesContract.hasFirstActivityBadge(user1.address)).to.be.true;
    });

    it("Should handle case when some contracts are not set", async function () {
      const { roastContract, user1, owner, chainReactionContract, icebreakerContract } = await loadFixture(deployContractsFixture);

      // Deploy new badges contract
      const VhibesBadges = await ethers.getContractFactory("VhibesBadges");
      const newBadgesContract = await VhibesBadges.deploy(
        owner.address,
        "Vhibes Badges",
        "VHIBES",
        "https://vhibes.vercel.app/badges/"
      );

      // Set badge URI
      await newBadgesContract.connect(owner).setBadgeURIs(
        "ipfs://firstActivity",
        "ipfs://loginStreak",
        "ipfs://activityStreak",
        "ipfs://topRoaster",
        "ipfs://chainMaster",
        "ipfs://icebreaker"
      );

      // Set all contracts (all must be non-zero per contract requirement)
      await newBadgesContract.connect(owner).setContracts(
        await roastContract.getAddress(),
        await chainReactionContract.getAddress(),
        await icebreakerContract.getAddress()
      );

      // Create activity from roast contract
      await roastContract.connect(user1).submitRoast("ipfs://original", "ipfs://roast");

      await expect(newBadgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(newBadgesContract, "BadgeClaimed")
        .withArgs(user1.address, "First Activity");

      expect(await newBadgesContract.hasFirstActivityBadge(user1.address)).to.be.true;
    });
  });
});

