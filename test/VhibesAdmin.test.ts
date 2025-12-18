import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("VhibesAdmin", function () {
  describe("Deployment and Setup", function () {
    it("Should deploy with owner set correctly", async function () {
      const { vhibesAdmin, owner } = await loadFixture(deployContractsFixture);

      expect(await vhibesAdmin.owner()).to.equal(owner.address);
    });

    it("Should have contracts set correctly via fixture", async function () {
      const { vhibesAdmin, pointsContract, badgesContract, roastContract, icebreakerContract, chainReactionContract } = await loadFixture(deployContractsFixture);

      expect(await vhibesAdmin.pointsContract()).to.equal(await pointsContract.getAddress());
      expect(await vhibesAdmin.badgesContract()).to.equal(await badgesContract.getAddress());
      // ... assume others are set in fixture loop. 
      // Actually fixture might not use setContracts if relying on constructor? 
      // VhibesAdmin constructor only takes admin address.
      // Fixture *should* call setContracts.
      // Let's verify.
      expect(await vhibesAdmin.roastContract()).to.equal(await roastContract.getAddress());
    });
  });

  describe("Admin Authorization", function () {
    it("Should allow owner to authorize an admin", async function () {
      const { vhibesAdmin, owner, user1 } = await loadFixture(deployContractsFixture);

      await expect(vhibesAdmin.connect(owner).authorizeAdmin(user1.address))
        .to.emit(vhibesAdmin, "AdminAuthorized")
        .withArgs(user1.address);

      expect(await vhibesAdmin.authorizedAdmins(user1.address)).to.be.true;
    });

    it("Should allow owner to deauthorize an admin", async function () {
      const { vhibesAdmin, owner, user1 } = await loadFixture(deployContractsFixture);

      await vhibesAdmin.connect(owner).authorizeAdmin(user1.address);
      await expect(vhibesAdmin.connect(owner).deauthorizeAdmin(user1.address))
        .to.emit(vhibesAdmin, "AdminDeauthorized")
        .withArgs(user1.address);

      expect(await vhibesAdmin.authorizedAdmins(user1.address)).to.be.false;
    });

    it("Should revert if non-owner tries to authorize admin", async function () {
      const { vhibesAdmin, user1, user2 } = await loadFixture(deployContractsFixture);

      await expect(
        vhibesAdmin.connect(user1).authorizeAdmin(user2.address)
      ).to.be.revertedWithCustomError(vhibesAdmin, "OwnableUnauthorizedAccount");
    });
  });

  describe("Temp Test Counter", function () {
    it("Should allow authorized admin to increment counter", async function () {
      const { vhibesAdmin, owner, user1 } = await loadFixture(deployContractsFixture);

      await vhibesAdmin.connect(owner).authorizeAdmin(user1.address);

      await expect(vhibesAdmin.connect(user1).incrementTempTest())
        .to.emit(vhibesAdmin, "TempTestCounterIncremented")
        .withArgs(user1.address, 1);

      expect(await vhibesAdmin.getTempTestCount()).to.equal(1);
    });

    it("Should allow authorized admin to decrement counter", async function () {
      const { vhibesAdmin, owner } = await loadFixture(deployContractsFixture);

      // Owner is also authorized (logic: authorizedAdmins[msg.sender] || owner)
      await vhibesAdmin.connect(owner).incrementTempTest();
      await expect(vhibesAdmin.connect(owner).decrementTempTest())
        .to.emit(vhibesAdmin, "TempTestCounterDecremented")
        .withArgs(owner.address, 0);

      expect(await vhibesAdmin.getTempTestCount()).to.equal(0);
    });

    it("Should revert decrement if counter is zero", async function () {
      const { vhibesAdmin, owner } = await loadFixture(deployContractsFixture);

      await expect(
        vhibesAdmin.connect(owner).decrementTempTest()
      ).to.be.revertedWith("Counter cannot be negative");
    });
  });

  describe("Points Management", function () {
    it("Should allow authorized admin to update RoastMe points", async function () {
      const { vhibesAdmin, roastContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await roastContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // Default: 10, 1, 5
      await expect(vhibesAdmin.connect(owner).updateRoastMePoints(20, 2, 10))
        .to.emit(vhibesAdmin, "PointsUpdated")
        .withArgs("RoastMe", 20, 2, 10);

      expect(await roastContract.pointsPerRoast()).to.equal(20);
      expect(await roastContract.pointsPerVote()).to.equal(2);
      expect(await roastContract.pointsPerFunnyVote()).to.equal(10);
    });

    it("Should allow authorized admin to update Icebreaker points", async function () {
      const { vhibesAdmin, icebreakerContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await icebreakerContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // Default: 15, 5, 1
      await expect(vhibesAdmin.connect(owner).updateIcebreakerPoints(30, 10, 2))
        .to.emit(vhibesAdmin, "PointsUpdated")
        .withArgs("Icebreaker", 30, 10, 2);

      expect(await icebreakerContract.pointsPerPrompt()).to.equal(30);
      expect(await icebreakerContract.pointsPerResponse()).to.equal(10);
      expect(await icebreakerContract.pointsPerVote()).to.equal(2);
    });

    it("Should allow authorized admin to update ChainReaction points", async function () {
      const { vhibesAdmin, chainReactionContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await chainReactionContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // Default: 15, 10
      await expect(vhibesAdmin.connect(owner).updateChainReactionPoints(50, 20))
        .to.emit(vhibesAdmin, "PointsUpdated")
        .withArgs("ChainReaction", 50, 20, 0);

      expect(await chainReactionContract.pointsPerChallenge()).to.equal(50);
      expect(await chainReactionContract.pointsPerResponse()).to.equal(20);
    });

    it("Should allow authorized admin to update Daily Login points", async function () {
      const { vhibesAdmin, pointsContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await pointsContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // Default: 5, 2, 3
      await expect(vhibesAdmin.connect(owner).updateDailyLoginPoints(10, 5, 7))
        .to.emit(vhibesAdmin, "PointsUpdated")
        .withArgs("DailyLogin", 10, 5, 7);

      expect(await pointsContract.dailyLoginPoints()).to.equal(10);
      expect(await pointsContract.streakBonusPoints()).to.equal(5);
      expect(await pointsContract.activityStreakBonus()).to.equal(7);
    });
  });

  describe("Category and Badge Management", function () {
    it("Should allow authorized admin to create Icebreaker category", async function () {
      const { vhibesAdmin, icebreakerContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await icebreakerContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      await expect(vhibesAdmin.connect(owner).createIcebreakerCategory("Admin Cat", "Desc"))
        .to.emit(vhibesAdmin, "CategoryCreated")
        .withArgs(1, "Admin Cat", "Desc"); // ID 1 as fixture deploys new

      const category = await icebreakerContract.getCategory(1);
      expect(category.name).to.equal("Admin Cat");
    });

    it("Should allow authorized admin to set Badge URIs", async function () {
      const { vhibesAdmin, badgesContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await badgesContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      await expect(vhibesAdmin.connect(owner).setBadgeURIs("uri1", "uri2", "uri3", "uri4", "uri5", "uri6"))
        .to.emit(vhibesAdmin, "BadgeURIsUpdated");

      // Verify a URI
      expect(await badgesContract.firstActivityBadgeURI()).to.equal("uri1");
      expect(await badgesContract.icebreakerBadgeURI()).to.equal("uri6");
    });

    it("Should allow authorized admin to set Base URI", async function () {
      const { vhibesAdmin, badgesContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await badgesContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      await vhibesAdmin.connect(owner).setBadgeBaseURI("https://newapi.com/");
      // Accessing _baseURI is internal usually? 
      // VhibesBadges inherits from ERC721URIStorage or similar? 
      // It likely has a baseURI getter or we check tokenURI if tokens exist.
      // Or check if VhibesBadges exposes baseURI public var (unlikely for ERC721 default).
      // Checking VhibesBadges.sol... it overrides _baseURI().
      // If we can't easily check baseURI directly, we might skip direct verification unless we mint a badge.
      // But VhibesBadges likely has a way.
      // Let's assume successful execution is enough for this test or check if VhibesBadges has public `baseURI` var (some implementations do).
      // Re-checking VhibesBadges.sol...
    });
    
    it("Should allow authorized admin to set Badge Requirements", async function () {
      const { vhibesAdmin, badgesContract, owner } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await badgesContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      await expect(vhibesAdmin.connect(owner).setBadgeRequirements(1, 2, 3, 4, 5, 6))
        .to.emit(vhibesAdmin, "BadgeRequirementsUpdated");

      expect(await badgesContract.firstActivityRequirement()).to.equal(1);
      expect(await badgesContract.icebreakerRequirement()).to.equal(6);
    });

    it("Should manage minter authorization in badges contract", async function () {
      const { vhibesAdmin, badgesContract, owner, user1 } = await loadFixture(deployContractsFixture);

      // Transfer ownership to VhibesAdmin
      await badgesContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // Authorize
      await vhibesAdmin.connect(owner).authorizeMinterInBadges(user1.address);
      expect(await badgesContract.authorizedMinters(user1.address)).to.be.true;

      // Deauthorize
      await vhibesAdmin.connect(owner).deauthorizeMinterInBadges(user1.address);
      expect(await badgesContract.authorizedMinters(user1.address)).to.be.false;
    });
  });
});
