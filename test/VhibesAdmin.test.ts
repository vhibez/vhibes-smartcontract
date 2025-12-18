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
});
