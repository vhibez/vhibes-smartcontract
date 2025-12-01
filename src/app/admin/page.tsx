"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState, useEffect } from "react";
import { Crown, Users, ChartLine, Settings, Lock, Zap, Flame, Snowflake, Gem, Trophy, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Import ABIs
import VhibesAdminArtifact from "../../abis/VhibesAdmin.json";
import VhibesPointsArtifact from "../../abis/VhibesPoints.json";
import VhibesBadgesArtifact from "../../abis/VhibesBadges.json";
import RoastMeContractArtifact from "../../abis/RoastMeContract.json";
import IcebreakerContractArtifact from "../../abis/IcebreakerContract.json";
import ChainReactionContractArtifact from "../../abis/ChainReactionContract.json";

// Extract ABIs from artifacts
const VhibesAdminABI = VhibesAdminArtifact.abi;
const VhibesPointsABI = VhibesPointsArtifact.abi;
const VhibesBadgesABI = VhibesBadgesArtifact.abi;
const RoastMeContractABI = RoastMeContractArtifact.abi;
const IcebreakerContractABI = IcebreakerContractArtifact.abi;
const ChainReactionContractABI = ChainReactionContractArtifact.abi;

// Contract addresses (Base Mainnet - Latest Deployment)
const VHIBES_ADMIN_ADDRESS = "0x4548f1c691b254DB4532C05D2118f66D2A78ec1C";
const VHIBES_POINTS_ADDRESS = "0x738be79661d225048F8C0881adBC47bAA9211b7b";
const VHIBES_BADGES_ADDRESS = "0xc0F8e7dA9d49A635f18d988f7a7C727eB0dA2C44";
const ROAST_ME_CONTRACT_ADDRESS = "0x96A472f40fcab11CB17045c04122Dd6e311F8324";
const ICEBREAKER_CONTRACT_ADDRESS = "0x72b92D55195c05E43A7E752839d6eCD23104ca8a";
const CHAIN_REACTION_CONTRACT_ADDRESS = "0xE09596824F17c41eD18cCe7d7035908526f2BF14";

// IPFS Upload Function for Badges (Private Files + Groups)
async function uploadBadgeToIPFS(
  image: File,
  badgeName: string,
  badgeDescription: string,
  badgeType: string,
  rarity: string,
  externalUrl: string = "https://vhibes.vercel.app"
) {
  try {
    if (!process.env.NEXT_PUBLIC_PINATA_JWT) {
      throw new Error("Pinata JWT missing - please set NEXT_PUBLIC_PINATA_JWT");
    }

    const { PinataSDK } = await import("pinata");
    const pinata = new PinataSDK({
      pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
      pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "http://pink-reasonable-falcon-782.mypinata.cloud/",
    });

    console.log("Setting up Vhibes Badges group...");

    // Create or get the Vhibes Badges group
    let badgesGroup;
    try {
      // Try to create the group first
      badgesGroup = await pinata.groups.private.create({
        name: "Vhibes Badges",
      });
      console.log("Created new Vhibes Badges group:", badgesGroup.id);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        // Group already exists, try to find it
        const groups = await pinata.groups.private.list();
        badgesGroup = groups.groups.find(group => group.name === "Vhibes Badges");
        if (!badgesGroup) {
          throw new Error("Could not find or create Vhibes Badges group");
        }
        console.log("Using existing Vhibes Badges group:", badgesGroup.id);
      } else {
        throw error;
      }
    }

    console.log("Uploading badge image to Private IPFS...");

    // Upload image to Private IPFS and add to the group
    const imageUpload = await pinata.upload.private
      .file(image)
      .group(badgesGroup.id);
    
    console.log("Private image uploaded to group:", imageUpload);

    const imageUri = `ipfs://${imageUpload.cid}`;

    // Create metadata
    const metadata = {
      name: badgeName,
      description: badgeDescription,
      image: imageUri,
      external_url: externalUrl,
      attributes: [
        { trait_type: "Badge Type", value: badgeType },
        { trait_type: "Rarity", value: rarity },
        { trait_type: "Access", value: "Private IPFS" },
        { trait_type: "Group", value: "Vhibes Badges" },
      ],
    };

    console.log("Uploading metadata to Pinata...");

    // Upload metadata to public IPFS (so it's discoverable)
    const metadataUpload = await pinata.upload.public.json(metadata);
    console.log("Metadata uploaded:", metadataUpload);

    // Return both the image CID and metadata URI
    return {
      imageCid: imageUpload.cid,
      metadataUri: `ipfs://${metadataUpload.cid}`,
      groupId: badgesGroup.id,
      privateImageUri: imageUri
    };
  } catch (error) {
    console.error("Pinata upload failed:", error);
    throw error;
  }
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoasts: 0,
    totalChains: 0,
    totalPoints: 0,
    totalBadges: 0,
    totalIcebreakers: 0
  });

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Check if current user is admin
  const { data: isAuthorizedAdmin } = useReadContract({
    address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
    abi: VhibesAdminABI,
    functionName: "isAuthorizedAdmin",
    args: address ? [address] : undefined,
  });

  // Get platform stats - only call when admin is authorized
  const { data: roastStats } = useReadContract({
    address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
    abi: VhibesAdminABI,
    functionName: "getRoastMeStats",
  });

  const { data: icebreakerStats } = useReadContract({
    address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
    abi: VhibesAdminABI,
    functionName: "getIcebreakerStats",
  });

  const { data: chainStats } = useReadContract({
    address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
    abi: VhibesAdminABI,
    functionName: "getChainReactionStats",
  });

  // Points management form state
  const [pointsForm, setPointsForm] = useState({
    roastPoints: 10,
    roastVotePoints: 5,
    roastFunnyPoints: 15,
    icebreakerPromptPoints: 20,
    icebreakerResponsePoints: 10,
    icebreakerVotePoints: 5,
    chainChallengePoints: 25,
    chainResponsePoints: 15,
    dailyLoginPoints: 5,
    streakBonusPoints: 10,
    activityStreakBonus: 20
  });

  // Badge management form state
  const [badgeForm, setBadgeForm] = useState({
    firstActivityRequirement: 1,
    loginStreakRequirement: 7,
    activityStreakRequirement: 5,
    topRoasterRequirement: 10,
    chainMasterRequirement: 5,
    icebreakerRequirement: 3
  });

  // Badge upload state
  const [badgeUpload, setBadgeUpload] = useState({
    badgeName: "",
    badgeDescription: "",
    badgeType: "",
    rarity: "Common",
    imageFile: null as File | null,
    imagePreview: "",
    isUploading: false,
    uploadProgress: ""
  });

  // Admin management state
  const [adminManagement, setAdminManagement] = useState({
    newAdminAddress: "",
    contractToAuthorize: "",
    minterToAuthorize: "",
    userAddress: "",
    pointsToAward: 0,
    pointsToDeduct: 0,
    reason: ""
  });

  // Badge URI management state
  const [badgeURIs, setBadgeURIs] = useState({
    firstActivityBadgeURI: "",
    loginStreakBadgeURI: "",
    activityStreakBadgeURI: "",
    topRoasterBadgeURI: "",
    chainMasterBadgeURI: "",
    icebreakerBadgeURI: "",
    baseURI: ""
  });

  // Category management
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });

  useEffect(() => {
    if (isAuthorizedAdmin !== undefined) {
      setIsAdmin(Boolean(isAuthorizedAdmin));
      setIsLoading(false);
    }
  }, [isAuthorizedAdmin]);

  useEffect(() => {
    if (roastStats && icebreakerStats && chainStats) {
      setStats({
        totalUsers: 0, // Would need to implement user counting
        totalRoasts: Number(roastStats) || 0,
        totalChains: Array.isArray(chainStats) ? Number(chainStats[0]) || 0 : 0,
        totalPoints: 0, // Would need to implement total points calculation
        totalBadges: 0, // Would need to implement badge counting
        totalIcebreakers: Array.isArray(icebreakerStats) ? Number(icebreakerStats[1]) || 0 : 0
      });
    }
  }, [roastStats, icebreakerStats, chainStats]);

  // Admin functions
  const updateRoastMePoints = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "updateRoastMePoints",
      args: [pointsForm.roastPoints, pointsForm.roastVotePoints, pointsForm.roastFunnyPoints]
    });
  };

  const updateIcebreakerPoints = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "updateIcebreakerPoints",
      args: [pointsForm.icebreakerPromptPoints, pointsForm.icebreakerResponsePoints, pointsForm.icebreakerVotePoints]
    });
  };

  const updateChainReactionPoints = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "updateChainReactionPoints",
      args: [pointsForm.chainChallengePoints, pointsForm.chainResponsePoints]
    });
  };

  const updateDailyLoginPoints = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "updateDailyLoginPoints",
      args: [pointsForm.dailyLoginPoints, pointsForm.streakBonusPoints, pointsForm.activityStreakBonus]
    });
  };

  const createIcebreakerCategory = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "createIcebreakerCategory",
      args: [newCategory.name, newCategory.description]
    });
  };

  const updateBadgeRequirements = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "setBadgeRequirements",
      args: [
        badgeForm.firstActivityRequirement,
        badgeForm.loginStreakRequirement,
        badgeForm.activityStreakRequirement,
        badgeForm.topRoasterRequirement,
        badgeForm.chainMasterRequirement,
        badgeForm.icebreakerRequirement
      ]
    });
  };

  // Badge upload functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBadgeUpload(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleBadgeUpload = async () => {
    if (!badgeUpload.imageFile || !badgeUpload.badgeName || !badgeUpload.badgeDescription || !badgeUpload.badgeType) {
      alert("Please fill in all fields and select an image");
      return;
    }

    setBadgeUpload(prev => ({ ...prev, isUploading: true, uploadProgress: "Uploading badge to Private IPFS..." }));

    try {
      const uploadResult = await uploadBadgeToIPFS(
        badgeUpload.imageFile,
        badgeUpload.badgeName,
        badgeUpload.badgeDescription,
        badgeUpload.badgeType,
        badgeUpload.rarity
      );

      setBadgeUpload(prev => ({ 
        ...prev, 
        uploadProgress: `Badge uploaded successfully! 
          Image CID: ${uploadResult.imageCid}
          Metadata URI: ${uploadResult.metadataUri}
          Group ID: ${uploadResult.groupId}
          Private Image URI: ${uploadResult.privateImageUri}`
      }));

      // Reset form
      setTimeout(() => {
        setBadgeUpload({
          badgeName: "",
          badgeDescription: "",
          badgeType: "",
          rarity: "Common",
          imageFile: null,
          imagePreview: "",
          isUploading: false,
          uploadProgress: ""
        });
      }, 3000);

    } catch (error) {
      console.error("Badge upload failed:", error);
      setBadgeUpload(prev => ({ 
        ...prev, 
        isUploading: false, 
        uploadProgress: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  };

  const clearBadgeUpload = () => {
    setBadgeUpload({
      badgeName: "",
      badgeDescription: "",
      badgeType: "",
      rarity: "Common",
      imageFile: null,
      imagePreview: "",
      isUploading: false,
      uploadProgress: ""
    });
  };

  // List all badges in the Vhibes Badges group
  const listBadgesInGroup = async () => {
    try {
      const { PinataSDK } = await import("pinata");
      const pinata = new PinataSDK({
        pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
        pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "http://pink-reasonable-falcon-782.mypinata.cloud/",
      });

      // Get all private groups
      const groups = await pinata.groups.private.list();
      const badgesGroup = groups.groups.find(group => group.name === "Vhibes Badges");
      
      if (badgesGroup) {
        // Get details of the badges group
        const groupDetails = await pinata.groups.private.get({
          groupId: badgesGroup.id,
        });
        
        console.log("Vhibes Badges Group:", groupDetails);
        alert(`Found Vhibes Badges group with ID: ${badgesGroup.id}\nCreated: ${badgesGroup.createdAt}`);
      } else {
        alert("Vhibes Badges group not found. Upload a badge first to create it.");
      }
    } catch (error) {
      console.error("Error listing badges:", error);
      alert("Failed to list badges: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  // Admin Management Functions
  const authorizeAdmin = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "authorizeAdmin",
      args: [adminManagement.newAdminAddress]
    });
  };

  const deauthorizeAdmin = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "deauthorizeAdmin",
      args: [adminManagement.newAdminAddress]
    });
  };

  // Contract Authorization Functions
  const authorizeContract = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "authorizeContractInPoints",
      args: [adminManagement.contractToAuthorize]
    });
  };

  const deauthorizeContract = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "deauthorizeContractInPoints",
      args: [adminManagement.contractToAuthorize]
    });
  };

  // Badge Minter Authorization Functions
  const authorizeMinter = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "authorizeMinterInBadges",
      args: [adminManagement.minterToAuthorize]
    });
  };

  const deauthorizeMinter = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "deauthorizeMinterInBadges",
      args: [adminManagement.minterToAuthorize]
    });
  };

  // Badge URI Management Functions
  const updateBadgeURIs = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "setBadgeURIs",
      args: [
        badgeURIs.firstActivityBadgeURI,
        badgeURIs.loginStreakBadgeURI,
        badgeURIs.activityStreakBadgeURI,
        badgeURIs.topRoasterBadgeURI,
        badgeURIs.chainMasterBadgeURI,
        badgeURIs.icebreakerBadgeURI
      ]
    });
  };

  const updateBadgeBaseURI = () => {
    writeContract({
      address: VHIBES_ADMIN_ADDRESS as `0x${string}`,
      abi: VhibesAdminABI,
      functionName: "setBadgeBaseURI",
      args: [badgeURIs.baseURI]
    });
  };

  // User Points Management Functions
  const awardPoints = () => {
    writeContract({
      address: VHIBES_POINTS_ADDRESS as `0x${string}`,
      abi: VhibesPointsABI,
      functionName: "earnPoints",
      args: [adminManagement.userAddress, adminManagement.pointsToAward, adminManagement.reason]
    });
  };

  const deductPoints = () => {
    writeContract({
      address: VHIBES_POINTS_ADDRESS as `0x${string}`,
      abi: VhibesPointsABI,
      functionName: "deductPoints",
      args: [adminManagement.userAddress, adminManagement.pointsToDeduct, adminManagement.reason]
    });
  };

  // Clear admin management form after successful transaction
  useEffect(() => {
    if (isSuccess) {
      setAdminManagement({
        newAdminAddress: "",
        contractToAuthorize: "",
        minterToAuthorize: "",
        userAddress: "",
        pointsToAward: 0,
        pointsToDeduct: 0,
        reason: ""
      });
    }
  }, [isSuccess]);

  const tabs = [
    { id: "overview", label: "Overview", icon: ChartLine },
    { id: "points", label: "Points Management", icon: Zap },
    { id: "badges", label: "Badge Management", icon: Trophy },
    { id: "badgeUpload", label: "Badge Upload", icon: Plus },
    { id: "categories", label: "Categories", icon: Settings },
    { id: "adminManagement", label: "Admin Management", icon: Crown },
    { id: "users", label: "User Management", icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 text-center border border-vhibes-primary/20">
                <Users size={24} className="text-vhibes-primary mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-xs text-vhibes-light">Total Users</div>
              </div>
              
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 text-center border border-vhibes-primary/20">
                <Flame size={24} className="text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{stats.totalRoasts}</div>
                <div className="text-xs text-vhibes-light">Total Roasts</div>
              </div>
              
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 text-center border border-vhibes-primary/20">
                <Zap size={24} className="text-yellow-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{stats.totalChains}</div>
                <div className="text-xs text-vhibes-light">Viral Chains</div>
              </div>
              
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 text-center border border-vhibes-primary/20">
                <Snowflake size={24} className="text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{stats.totalIcebreakers}</div>
                <div className="text-xs text-vhibes-light">Icebreakers</div>
              </div>
              
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 text-center border border-vhibes-primary/20">
                <Gem size={24} className="text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{stats.totalPoints}</div>
                <div className="text-xs text-vhibes-light">Points Awarded</div>
              </div>
              
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 text-center border border-vhibes-primary/20">
                <Trophy size={24} className="text-yellow-500 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{stats.totalBadges}</div>
                <div className="text-xs text-vhibes-light">Badges Minted</div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
              <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                  <span className="text-white">Smart Contracts</span>
                  <span className="text-green-400">✓ Online</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                  <span className="text-white">IPFS Storage</span>
                  <span className="text-green-400">✓ Online</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                  <span className="text-white">AI Services</span>
                  <span className="text-green-400">✓ Online</span>
                </div>
              </div>
            </div>
          </>
        );

      case "points":
        return (
          <div className="space-y-6">
            {/* RoastMe Points */}
            <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="text-red-400" size={20} />
                RoastMe Points Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Roast</label>
                  <input
                    type="number"
                    value={pointsForm.roastPoints}
                    onChange={(e) => setPointsForm({...pointsForm, roastPoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Vote</label>
                  <input
                    type="number"
                    value={pointsForm.roastVotePoints}
                    onChange={(e) => setPointsForm({...pointsForm, roastVotePoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Funny Vote</label>
                  <input
                    type="number"
                    value={pointsForm.roastFunnyPoints}
                    onChange={(e) => setPointsForm({...pointsForm, roastFunnyPoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={updateRoastMePoints}
                disabled={isPending}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update RoastMe Points"}
              </button>
            </div>

            {/* Icebreaker Points */}
            <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Snowflake className="text-blue-400" size={20} />
                Icebreaker Points Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Prompt</label>
                  <input
                    type="number"
                    value={pointsForm.icebreakerPromptPoints}
                    onChange={(e) => setPointsForm({...pointsForm, icebreakerPromptPoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Response</label>
                  <input
                    type="number"
                    value={pointsForm.icebreakerResponsePoints}
                    onChange={(e) => setPointsForm({...pointsForm, icebreakerResponsePoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Vote</label>
                  <input
                    type="number"
                    value={pointsForm.icebreakerVotePoints}
                    onChange={(e) => setPointsForm({...pointsForm, icebreakerVotePoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={updateIcebreakerPoints}
                disabled={isPending}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update Icebreaker Points"}
              </button>
            </div>

            {/* Chain Reaction Points */}
            <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} />
                Chain Reaction Points Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Challenge</label>
                  <input
                    type="number"
                    value={pointsForm.chainChallengePoints}
                    onChange={(e) => setPointsForm({...pointsForm, chainChallengePoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points per Response</label>
                  <input
                    type="number"
                    value={pointsForm.chainResponsePoints}
                    onChange={(e) => setPointsForm({...pointsForm, chainResponsePoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={updateChainReactionPoints}
                disabled={isPending}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update Chain Reaction Points"}
              </button>
            </div>

            {/* Daily Login Points */}
            <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Gem className="text-purple-400" size={20} />
                Daily Login Points Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Daily Login Points</label>
                  <input
                    type="number"
                    value={pointsForm.dailyLoginPoints}
                    onChange={(e) => setPointsForm({...pointsForm, dailyLoginPoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Streak Bonus Points</label>
                  <input
                    type="number"
                    value={pointsForm.streakBonusPoints}
                    onChange={(e) => setPointsForm({...pointsForm, streakBonusPoints: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Activity Streak Bonus</label>
                  <input
                    type="number"
                    value={pointsForm.activityStreakBonus}
                    onChange={(e) => setPointsForm({...pointsForm, activityStreakBonus: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={updateDailyLoginPoints}
                disabled={isPending}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update Daily Login Points"}
              </button>
            </div>
          </div>
        );

      case "badges":
        return (
          <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-400" size={20} />
              Badge Management
            </h3>
            
            {/* Badge Requirements */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-white mb-4">Badge Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">First Activity Requirement</label>
                  <input
                    type="number"
                    value={badgeForm.firstActivityRequirement}
                    onChange={(e) => setBadgeForm({...badgeForm, firstActivityRequirement: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Login Streak Requirement</label>
                  <input
                    type="number"
                    value={badgeForm.loginStreakRequirement}
                    onChange={(e) => setBadgeForm({...badgeForm, loginStreakRequirement: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Activity Streak Requirement</label>
                  <input
                    type="number"
                    value={badgeForm.activityStreakRequirement}
                    onChange={(e) => setBadgeForm({...badgeForm, activityStreakRequirement: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Top Roaster Requirement</label>
                  <input
                    type="number"
                    value={badgeForm.topRoasterRequirement}
                    onChange={(e) => setBadgeForm({...badgeForm, topRoasterRequirement: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Chain Master Requirement</label>
                  <input
                    type="number"
                    value={badgeForm.chainMasterRequirement}
                    onChange={(e) => setBadgeForm({...badgeForm, chainMasterRequirement: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Icebreaker Requirement</label>
                  <input
                    type="number"
                    value={badgeForm.icebreakerRequirement}
                    onChange={(e) => setBadgeForm({...badgeForm, icebreakerRequirement: Number(e.target.value)})}
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={updateBadgeRequirements}
                disabled={isPending}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update Badge Requirements"}
              </button>
            </div>

            {/* Badge URIs */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-white mb-4">Badge URIs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">First Activity Badge URI</label>
                  <input
                    type="text"
                    value={badgeURIs.firstActivityBadgeURI}
                    onChange={(e) => setBadgeURIs({...badgeURIs, firstActivityBadgeURI: e.target.value})}
                    placeholder="ipfs://..."
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Login Streak Badge URI</label>
                  <input
                    type="text"
                    value={badgeURIs.loginStreakBadgeURI}
                    onChange={(e) => setBadgeURIs({...badgeURIs, loginStreakBadgeURI: e.target.value})}
                    placeholder="ipfs://..."
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Activity Streak Badge URI</label>
                  <input
                    type="text"
                    value={badgeURIs.activityStreakBadgeURI}
                    onChange={(e) => setBadgeURIs({...badgeURIs, activityStreakBadgeURI: e.target.value})}
                    placeholder="ipfs://..."
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Top Roaster Badge URI</label>
                  <input
                    type="text"
                    value={badgeURIs.topRoasterBadgeURI}
                    onChange={(e) => setBadgeURIs({...badgeURIs, topRoasterBadgeURI: e.target.value})}
                    placeholder="ipfs://..."
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Chain Master Badge URI</label>
                  <input
                    type="text"
                    value={badgeURIs.chainMasterBadgeURI}
                    onChange={(e) => setBadgeURIs({...badgeURIs, chainMasterBadgeURI: e.target.value})}
                    placeholder="ipfs://..."
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Icebreaker Badge URI</label>
                  <input
                    type="text"
                    value={badgeURIs.icebreakerBadgeURI}
                    onChange={(e) => setBadgeURIs({...badgeURIs, icebreakerBadgeURI: e.target.value})}
                    placeholder="ipfs://..."
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <button
                onClick={updateBadgeURIs}
                disabled={isPending}
                className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update Badge URIs"}
              </button>
            </div>

            {/* Badge Base URI */}
            <div>
              <h4 className="text-md font-semibold text-white mb-4">Badge Base URI</h4>
              <div className="mb-4">
                <label className="block text-sm text-vhibes-light mb-1">Base URI</label>
                <input
                  type="text"
                  value={badgeURIs.baseURI}
                  onChange={(e) => setBadgeURIs({...badgeURIs, baseURI: e.target.value})}
                  placeholder="https://..."
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <button
                onClick={updateBadgeBaseURI}
                disabled={isPending}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isPending ? "Updating..." : "Update Base URI"}
              </button>
            </div>
          </div>
        );

      case "badgeUpload":
        return (
          <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="text-green-400" size={20} />
              Upload New Badge
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-vhibes-light mb-1">Badge Name</label>
                <input
                  type="text"
                  value={badgeUpload.badgeName}
                  onChange={(e) => setBadgeUpload({...badgeUpload, badgeName: e.target.value})}
                  placeholder="Enter badge name"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-vhibes-light mb-1">Badge Description</label>
                <input
                  type="text"
                  value={badgeUpload.badgeDescription}
                  onChange={(e) => setBadgeUpload({...badgeUpload, badgeDescription: e.target.value})}
                  placeholder="Enter badge description"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-vhibes-light mb-1">Badge Type</label>
                <input
                  type="text"
                  value={badgeUpload.badgeType}
                  onChange={(e) => setBadgeUpload({...badgeUpload, badgeType: e.target.value})}
                  placeholder="Enter badge type (e.g., 'Roast', 'Icebreaker', 'Chain')"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-vhibes-light mb-1">Rarity</label>
                <select
                  value={badgeUpload.rarity}
                  onChange={(e) => setBadgeUpload({...badgeUpload, rarity: e.target.value})}
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-vhibes-light mb-1">Badge Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-vhibes-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-vhibes-primary file:text-white hover:file:bg-vhibes-primary/80"
              />
              {badgeUpload.imagePreview && (
                <div className="mt-4">
                  <img src={badgeUpload.imagePreview} alt="Badge Preview" className="max-w-sm h-auto rounded-lg" />
                </div>
              )}
            </div>
            <button
              onClick={handleBadgeUpload}
              disabled={isPending || !badgeUpload.imageFile || !badgeUpload.badgeName || !badgeUpload.badgeDescription || !badgeUpload.badgeType}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isPending ? "Uploading..." : "Upload Badge"}
            </button>
            {badgeUpload.isUploading && (
              <div className="mt-4 text-vhibes-light">
                {badgeUpload.uploadProgress}
              </div>
            )}
            {badgeUpload.uploadProgress && !badgeUpload.isUploading && (
              <div className="mt-4 text-green-400">
                {badgeUpload.uploadProgress}
              </div>
            )}
            {badgeUpload.uploadProgress && !badgeUpload.isUploading && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={clearBadgeUpload}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Clear Upload
                </button>
                <button
                  onClick={listBadgesInGroup}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  List Badges in Group
                </button>
              </div>
            )}
          </div>
        );

      case "adminManagement":
        return (
          <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Crown className="text-vhibes-primary" size={20} />
              Admin Management
            </h3>
            
            {/* Admin Authorization */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-white mb-4">Admin Authorization</h4>
              <div className="mb-4">
                <label className="block text-sm text-vhibes-light mb-1">New Admin Address</label>
                <input
                  type="text"
                  value={adminManagement.newAdminAddress}
                  onChange={(e) => setAdminManagement({...adminManagement, newAdminAddress: e.target.value})}
                  placeholder="Enter new admin address"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={authorizeAdmin}
                    disabled={isPending || !adminManagement.newAdminAddress}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Authorizing..." : "Authorize Admin"}
                  </button>
                  <button
                    onClick={deauthorizeAdmin}
                    disabled={isPending || !adminManagement.newAdminAddress}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Deauthorizing..." : "Deauthorize Admin"}
                  </button>
                </div>
              </div>
            </div>

            {/* Contract Authorization */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-white mb-4">Contract Authorization</h4>
              <div className="mb-4">
                <label className="block text-sm text-vhibes-light mb-1">Contract to Authorize</label>
                <input
                  type="text"
                  value={adminManagement.contractToAuthorize}
                  onChange={(e) => setAdminManagement({...adminManagement, contractToAuthorize: e.target.value})}
                  placeholder="Enter contract address to authorize"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={authorizeContract}
                    disabled={isPending || !adminManagement.contractToAuthorize}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Authorizing Contract..." : "Authorize Contract"}
                  </button>
                  <button
                    onClick={deauthorizeContract}
                    disabled={isPending || !adminManagement.contractToAuthorize}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Deauthorizing Contract..." : "Deauthorize Contract"}
                  </button>
                </div>
              </div>
            </div>

            {/* Minter Authorization */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-white mb-4">Minter Authorization</h4>
              <div className="mb-4">
                <label className="block text-sm text-vhibes-light mb-1">Minter to Authorize</label>
                <input
                  type="text"
                  value={adminManagement.minterToAuthorize}
                  onChange={(e) => setAdminManagement({...adminManagement, minterToAuthorize: e.target.value})}
                  placeholder="Enter minter address to authorize"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={authorizeMinter}
                    disabled={isPending || !adminManagement.minterToAuthorize}
                    className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Authorizing Minter..." : "Authorize Minter"}
                  </button>
                  <button
                    onClick={deauthorizeMinter}
                    disabled={isPending || !adminManagement.minterToAuthorize}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Deauthorizing Minter..." : "Deauthorize Minter"}
                  </button>
                </div>
              </div>
            </div>

            {/* User Points Management */}
            <div className="mb-8">
              <h4 className="text-md font-semibold text-white mb-4">User Points Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">User Address</label>
                  <input
                    type="text"
                    value={adminManagement.userAddress}
                    onChange={(e) => setAdminManagement({...adminManagement, userAddress: e.target.value})}
                    placeholder="Enter user address for points"
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Reason</label>
                  <input
                    type="text"
                    value={adminManagement.reason}
                    onChange={(e) => setAdminManagement({...adminManagement, reason: e.target.value})}
                    placeholder="Enter reason for points"
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points to Award</label>
                  <input
                    type="number"
                    value={adminManagement.pointsToAward}
                    onChange={(e) => setAdminManagement({...adminManagement, pointsToAward: Number(e.target.value)})}
                    placeholder="Enter points to award"
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white mb-2"
                  />
                  <button
                    onClick={awardPoints}
                    disabled={isPending || !adminManagement.userAddress || adminManagement.pointsToAward === 0}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Awarding Points..." : "Award Points"}
                  </button>
                </div>
                <div>
                  <label className="block text-sm text-vhibes-light mb-1">Points to Deduct</label>
                  <input
                    type="number"
                    value={adminManagement.pointsToDeduct}
                    onChange={(e) => setAdminManagement({...adminManagement, pointsToDeduct: Number(e.target.value)})}
                    placeholder="Enter points to deduct"
                    className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white mb-2"
                  />
                  <button
                    onClick={deductPoints}
                    disabled={isPending || !adminManagement.userAddress || adminManagement.pointsToDeduct === 0}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isPending ? "Deducting Points..." : "Deduct Points"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "categories":
        return (
          <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="text-green-400" size={20} />
              Create New Icebreaker Category
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-vhibes-light mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="Enter category name"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-vhibes-light mb-1">Description</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Enter category description"
                  className="w-full bg-vhibes-dark/60 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              onClick={createIcebreakerCategory}
              disabled={isPending || !newCategory.name || !newCategory.description}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isPending ? "Creating..." : "Create Category"}
            </button>
          </div>
        );

      case "users":
        return (
          <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-6 border border-vhibes-primary/20">
            <h3 className="text-lg font-bold text-white mb-4">User Management</h3>
            <p className="text-vhibes-light">User management features coming soon...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen vibecaster-bg flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center">
        {isLoading ? (
          <div className="text-center">
            <div className="text-white">Loading...</div>
          </div>
        ) : !isConnected ? (
          <div className="text-center">
            <Lock size={64} className="text-vhibes-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-vhibes-light">Please connect your wallet to access admin features.</p>
          </div>
        ) : !isAdmin ? (
          <div className="text-center">
            <Crown size={64} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
            <p className="text-vhibes-light mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-white/60">
              Address: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        ) : (
          <main className="container mx-auto px-4 py-8 w-full">
            {/* Admin Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4 md:gap-0">
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white mb-2">
                  <Crown className="inline text-vhibes-primary mr-2 md:mr-3" size={24} />
                  Vhibes Admin
                </h1>
                <p className="text-xs md:text-sm text-vhibes-light">
                  Platform management and analytics
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-xs md:text-sm text-vhibes-light">Admin Access</p>
                <p className="text-xs text-white/60 font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-1 md:gap-2 mb-6 md:mb-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-all duration-300 border ${
                      isActive
                        ? "bg-vhibes-primary text-white shadow-lg shadow-vhibes-primary/25 border-vhibes-primary"
                        : "text-white hover:bg-vhibes-primary/20 hover:shadow-md border-vhibes-primary/20"
                    }`}
                  >
                    <Icon size={14} className="md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Transaction Status */}
            {(isPending || isConfirming) && (
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 mb-6 bg-yellow-500/20 border border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <RefreshCw className="text-yellow-400 animate-spin" size={20} />
                  <span className="text-white">
                    {isPending ? "Waiting for transaction..." : "Confirming transaction..."}
                  </span>
                </div>
              </div>
            )}

            {isSuccess && (
              <div className="bg-vhibes-dark/40 backdrop-blur-lg rounded-lg p-4 mb-6 bg-green-500/20 border border-green-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span className="text-white">Transaction successful!</span>
                </div>
              </div>
            )}

            {/* Main Content */}
            {renderContent()}
          </main>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

