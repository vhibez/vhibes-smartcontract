import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("Integration Tests", function () {
  describe("Cross-Contract Points and Badges", function () {
    it("Should award points and check badge eligibility for RoastMe", async function () {
      const { 
        roastContract, 
        pointsContract, 
        badgesContract, 
        vhibesAdmin, 
        user1, 
        owner 
      } = await loadFixture(deployContractsFixture);

      // Setup: Transfer ownership to Admin for realistic scenario
      await roastContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      await pointsContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      await badgesContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // 1. Submit Roast -> Earn Points
      await roastContract.connect(user1).submitRoast("ipfs://img", "ipfs://meta");
      
      // Check points: 10 per roast (default)
      expect(await pointsContract.getPoints(user1.address)).to.equal(10);

      // 2. Check Badge Eligibility (First Activity)
      // Requirement: 1 activity. User1 has 1 roast.
      // Claim badge
      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(badgesContract, "BadgeClaimed")
        .withArgs(user1.address, "First Activity");

      expect(await badgesContract.balanceOf(user1.address)).to.equal(1);
    });

    it("Should award points and badges for Icebreaker flow", async function () {
      const { 
        icebreakerContract, 
        pointsContract, 
        badgesContract, 
        vhibesAdmin, 
        user1, 
        owner 
      } = await loadFixture(deployContractsFixture);

      // Setup ownership
      await icebreakerContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      await pointsContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      
      // Create Category (Owner/Admin)
      await vhibesAdmin.connect(owner).createIcebreakerCategory("Fun", "Desc");

      // 1. Create Prompt -> Earn Points
      await icebreakerContract.connect(user1).createPrompt("Prompt?", "Fun");
      
      // Points: 15 per prompt
      expect(await pointsContract.getPoints(user1.address)).to.equal(15);
      
      // 2. Submit Response -> Earn Points
      await icebreakerContract.connect(user1).submitResponse(1, "Response", "");
      
      // Points: 15 + 5 = 20
      expect(await pointsContract.getPoints(user1.address)).to.equal(20);
    });
  });

  describe("Full User Journey", function () {
    it("Should track activity across all apps for badges", async function () {
      const { 
        roastContract,
        chainReactionContract,
        icebreakerContract,
        badgesContract,
        vhibesAdmin,
        user1,
        owner
      } = await loadFixture(deployContractsFixture);

      // Transfer ownerships
      await roastContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      await chainReactionContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      await icebreakerContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());
      await badgesContract.connect(owner).transferOwnership(await vhibesAdmin.getAddress());

      // 1. Roast Activity
      await roastContract.connect(user1).submitRoast("ipfs://1", "ipfs://1");

      // 2. Chain Reaction Activity
      await chainReactionContract.connect(user1).createChallenge("Challenge", "ipfs://c", 100);

      // 3. Icebreaker Activity
      await vhibesAdmin.connect(owner).createIcebreakerCategory("Cat", "Desc");
      await icebreakerContract.connect(user1).createPrompt("Prompt", "Cat");

      // Total Activity: 1 + 1 + 1 = 3
      // Requirements: First Activity (1)
      
      await expect(badgesContract.connect(user1).claimFirstActivityBadge())
        .to.emit(badgesContract, "BadgeClaimed");
    });
  });
});
