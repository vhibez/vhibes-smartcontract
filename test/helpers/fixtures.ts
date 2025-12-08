import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

export async function deployContractsFixture() {
  const [owner, admin, user1, user2] = await ethers.getSigners();

  // Deploy VhibesPoints
  const VhibesPoints = await ethers.getContractFactory("VhibesPoints");
  const pointsContract = await VhibesPoints.deploy(owner.address);

  // Deploy VhibesBadges
  const VhibesBadges = await ethers.getContractFactory("VhibesBadges");
  const badgesContract = await VhibesBadges.deploy(
    owner.address,
    "Vhibes Badges",
    "VHIBES",
    "https://vhibes.vercel.app/badges/"
  );

  // Deploy RoastMeContract
  const RoastMeContract = await ethers.getContractFactory("RoastMeContract");
  const roastContract = await RoastMeContract.deploy(
    owner.address,
    await pointsContract.getAddress(),
    await badgesContract.getAddress()
  );

  // Deploy ChainReactionContract
  const ChainReactionContract = await ethers.getContractFactory("ChainReactionContract");
  const chainReactionContract = await ChainReactionContract.deploy(
    owner.address,
    await pointsContract.getAddress(),
    await badgesContract.getAddress()
  );

  // Deploy IcebreakerContract
  const IcebreakerContract = await ethers.getContractFactory("IcebreakerContract");
  const icebreakerContract = await IcebreakerContract.deploy(
    owner.address,
    await pointsContract.getAddress(),
    await badgesContract.getAddress()
  );

  // Authorize contracts in VhibesPoints
  await pointsContract.authorizeContract(await roastContract.getAddress());
  await pointsContract.authorizeContract(await chainReactionContract.getAddress());
  await pointsContract.authorizeContract(await icebreakerContract.getAddress());

  // Set contracts in VhibesBadges
  await badgesContract.setContracts(
    await roastContract.getAddress(),
    await chainReactionContract.getAddress(),
    await icebreakerContract.getAddress()
  );

  // Set badge URIs
  await badgesContract.setBadgeURIs(
    "ipfs://firstActivity",
    "ipfs://loginStreak",
    "ipfs://activityStreak",
    "ipfs://topRoaster",
    "ipfs://chainMaster",
    "ipfs://icebreaker"
  );

  return {
    owner,
    admin,
    user1,
    user2,
    pointsContract,
    badgesContract,
    roastContract,
    chainReactionContract,
    icebreakerContract,
  };
}

