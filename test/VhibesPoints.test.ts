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
});
