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
});
