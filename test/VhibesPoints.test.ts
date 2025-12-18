import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployContractsFixture } from "./helpers/fixtures";

describe("VhibesPoints", function () {
  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      const { pointsContract, owner } = await loadFixture(deployContractsFixture);

      expect(await pointsContract.owner()).to.equal(owner.address);
      expect(await pointsContract.dailyLoginPoints()).to.equal(5);
      expect(await pointsContract.streakBonusPoints()).to.equal(2);
      expect(await pointsContract.activityStreakBonus()).to.equal(3);
    });

    it("Should initialize default levels", async function () {
      const { pointsContract } = await loadFixture(deployContractsFixture);

      const [names, minPoints] = await pointsContract.getLevels();
      expect(names.length).to.equal(5);
      expect(names[0]).to.equal("Vibe Newbie");
      expect(minPoints[0]).to.equal(0);
      expect(names[4]).to.equal("Vibe Master");
      expect(minPoints[4]).to.equal(1000);
    });
  });

  describe("Contract Authorization", function () {
    it("Should allow owner to authorize a contract", async function () {
      const { pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

      await expect(pointsContract.connect(owner).authorizeContract(user1.address))
        .to.emit(pointsContract, "ContractAuthorized")
        .withArgs(user1.address);

      expect(await pointsContract.isAuthorized(user1.address)).to.be.true;
    });

    it("Should allow owner to deauthorize a contract", async function () {
      const { pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

      await pointsContract.connect(owner).authorizeContract(user1.address);
      await expect(pointsContract.connect(owner).deauthorizeContract(user1.address))
        .to.emit(pointsContract, "ContractDeauthorized")
        .withArgs(user1.address);

      expect(await pointsContract.isAuthorized(user1.address)).to.be.false;
    });

    it("Should revert if non-owner tries to authorize", async function () {
      const { pointsContract, user1, user2 } = await loadFixture(deployContractsFixture);

      await expect(
        pointsContract.connect(user1).authorizeContract(user2.address)
      ).to.be.revertedWithCustomError(pointsContract, "OwnableUnauthorizedAccount");
    });
  });

  describe("Point Management", function () {
    it("Should allow authorized contract to award points", async function () {
      const { pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

      // Owner is authorized by default? No, check contract logic.
      // modifier onlyAuthorized checks: authorizedContracts[msg.sender] || msg.sender == owner()
      
      const points = 100;
      await expect(pointsContract.connect(owner).earnPoints(user1.address, points, "Test award"))
        .to.emit(pointsContract, "PointsAwarded")
        .withArgs(user1.address, points, "Test award");

      expect(await pointsContract.getPoints(user1.address)).to.equal(points);
    });

    it("Should allow authorized contract to deduct points", async function () {
      const { pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

      await pointsContract.connect(owner).earnPoints(user1.address, 100, "Initial");
      
      await expect(pointsContract.connect(owner).deductPoints(user1.address, 50, "Penalty"))
        .to.emit(pointsContract, "PointsDeducted")
        .withArgs(user1.address, 50, "Penalty");

      expect(await pointsContract.getPoints(user1.address)).to.equal(50);
    });

    it("Should revert if deducting more points than balance", async function () {
      const { pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

      await pointsContract.connect(owner).earnPoints(user1.address, 10, "Initial");
      
      await expect(
        pointsContract.connect(owner).deductPoints(user1.address, 20, "Over penalty")
      ).to.be.revertedWith("Insufficient points");
    });
  });

  describe("Streak Management", function () {
    describe("Daily Login", function () {
      it("Should award points for first daily login", async function () {
        const { pointsContract, user1 } = await loadFixture(deployContractsFixture);

        const pointsBefore = await pointsContract.getPoints(user1.address);
        await pointsContract.connect(user1).dailyLogin();
        const pointsAfter = await pointsContract.getPoints(user1.address);

        // First login: streak 0->1?
        // Code: if (currentTime >= lastLoginTimestamp ... + DAY)
        // Initial lastLogin is 0, so yes.
        // Streak becomes 1 (reset logic if time diff large, but here it's first)
        // Points: dailyLoginPoints + (streak * streakBonus) = 5 + (1*2) = 7
        
        expect(pointsAfter - pointsBefore).to.equal(7);
        expect(await pointsContract.getLoginStreak(user1.address)).to.equal(1);
      });

      it("Should not award points if login again same day", async function () {
        const { pointsContract, user1 } = await loadFixture(deployContractsFixture);

        await pointsContract.connect(user1).dailyLogin();
        const pointsBefore = await pointsContract.getPoints(user1.address);
        
        // Try again immediately
        await pointsContract.connect(user1).dailyLogin();
        const pointsAfter = await pointsContract.getPoints(user1.address);

        expect(pointsAfter).to.equal(pointsBefore);
      });

      it("Should increment streak on consecutive day login", async function () {
        const { pointsContract, user1 } = await loadFixture(deployContractsFixture);

        await pointsContract.connect(user1).dailyLogin();
        
        // Advance time by 25 hours
        await time.increase(25 * 3600);
        
        await pointsContract.connect(user1).dailyLogin();
        
        expect(await pointsContract.getLoginStreak(user1.address)).to.equal(2);
        
        // Points: 5 + (2*2) = 9
        const points = await pointsContract.getPoints(user1.address);
        // Total = 7 (day 1) + 9 (day 2) = 16
        expect(points).to.equal(16);
      });

      it("Should reset streak if login missed a day", async function () {
        const { pointsContract, user1 } = await loadFixture(deployContractsFixture);

        await pointsContract.connect(user1).dailyLogin();
        
        // Advance time by 50 hours (> 2 days)
        await time.increase(50 * 3600);
        
        await pointsContract.connect(user1).dailyLogin();
        
        expect(await pointsContract.getLoginStreak(user1.address)).to.equal(1);
      });
    });

    describe("Activity Streak", function () {
      it("Should award bonus points for activity streak > 1", async function () {
        const { pointsContract, owner, user1 } = await loadFixture(deployContractsFixture);

        // Trigger activity (via authorized call)
        await pointsContract.connect(owner).recordActivity(); // owner is authorized
        // But recordActivity uses tx.origin. 
        // We need user1 to initiate a tx that calls recordActivity.
        // We can use authorized address to modify state directly for testing if accessible?
        // Or assume authorized contract calls it. 
        // recordActivity uses tx.origin: address user = tx.origin;
        // If we call directly from EOA, tx.origin is msg.sender.
        
        // Note: owner is authorized, so owner can call it directly.
        // If user1 calls a function on another contract that calls recordActivity, user1 is tx.origin.
        // But for unit test, can we call recordActivity directly?
        // "onlyAuthorized" modifier. So user1 cannot call it directly unless authorized.
        // But owner can call it. If owner calls it, user is owner.
        
        // Let's test with owner for simplicity
        await pointsContract.connect(owner).recordActivity();
        
        // Advance 25 hours
        await time.increase(25 * 3600);
        
        const pointsBefore = await pointsContract.getPoints(owner.address);
        await pointsContract.connect(owner).recordActivity();
        const pointsAfter = await pointsContract.getPoints(owner.address);
        
        // Streak 2. Bonus = 2 * 3 = 6 points.
        expect(pointsAfter - pointsBefore).to.equal(6);
        expect(await pointsContract.getActivityStreak(owner.address)).to.equal(2);
      });
    });
  });
});
