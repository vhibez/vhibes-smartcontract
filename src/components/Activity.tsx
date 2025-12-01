"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Flame, Snowflake, Zap, RefreshCw, Trophy, Medal, Crown, Star, Lock, Sparkles } from 'lucide-react';
import VhibesPointsArtifact from '@/abis/VhibesPoints.json';
import VhibesBadgesArtifact from '@/abis/VhibesBadges.json';
import RoastMeContractArtifact from '@/abis/RoastMeContract.json';
import IcebreakerContractArtifact from '@/abis/IcebreakerContract.json';
import ChainReactionContractArtifact from '@/abis/ChainReactionContract.json';

const VhibesPointsABI = VhibesPointsArtifact.abi;
const VhibesBadgesABI = VhibesBadgesArtifact.abi;
const RoastMeContractABI = RoastMeContractArtifact.abi;
const IcebreakerContractABI = IcebreakerContractArtifact.abi;
const ChainReactionContractABI = ChainReactionContractArtifact.abi;

// Contract addresses (Base Mainnet - Latest Deployment)
const VHIBES_POINTS_ADDRESS = "0x738be79661d225048F8C0881adBC47bAA9211b7b";
const VHIBES_BADGES_ADDRESS = "0xc0F8e7dA9d49A635f18d988f7a7C727eB0dA2C44";
const ROAST_ME_CONTRACT_ADDRESS = "0x96A472f40fcab11CB17045c04122Dd6e311F8324";
const ICEBREAKER_CONTRACT_ADDRESS = "0x72b92D55195c05E43A7E752839d6eCD23104ca8a";
const CHAIN_REACTION_CONTRACT_ADDRESS = "0xE09596824F17c41eD18cCe7d7035908526f2BF14";

interface ActivityProps {
  setActiveTab: (tab: string) => void;
}

interface RoastItem {
  id: number;
  title: string;
  image: string;
  likes: number;
  timestamp: string;
  creator: string;
}

interface ChainReactionItem {
  id: number;
  title: string;
  image: string;
  likes: number;
  timestamp: string;
  creator: string;
  participants: number;
}

interface BadgeData {
  id: number;
  name: string;
  description: string;
  imageUri: string;
  requirement: string;
  requirementValue: number;
  currentValue: number;
  isUnlocked: boolean;
  isMinted: boolean;
  rarity: string;
  type: string;
}

export default function Activity({ setActiveTab }: ActivityProps) {
  const { address, isConnected } = useAccount();
  const [activityFilter, setActivityFilter] = useState("all");
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userBadges, setUserBadges] = useState<number[]>([]);
  const [totalRoasts, setTotalRoasts] = useState<number>(0);
  const [totalChainReactions, setTotalChainReactions] = useState<number>(0);
  const [totalIcebreakers, setTotalIcebreakers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentRoasts, setRecentRoasts] = useState<RoastItem[]>([]);
  const [recentChainReactions, setRecentChainReactions] = useState<ChainReactionItem[]>([]);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);

  // Contract write function for minting badges
  const { writeContract } = useWriteContract();

  // Contract read functions
  const { data: pointsData } = useReadContract({
    address: VHIBES_POINTS_ADDRESS,
    abi: VhibesPointsABI,
    functionName: "userPoints",
    args: address ? [address] : undefined,
  });

  // Get user-specific roast count
  const { data: userRoastsData } = useReadContract({
    address: ROAST_ME_CONTRACT_ADDRESS,
    abi: RoastMeContractABI,
    functionName: "getUserRoasts",
    args: address ? [address] : undefined,
  });

  // Get user-specific chain reaction count
  const { data: userChainReactionsData } = useReadContract({
    address: CHAIN_REACTION_CONTRACT_ADDRESS,
    abi: ChainReactionContractABI,
    functionName: "getUserChallenges",
    args: address ? [address] : undefined,
  });

  // Get user-specific icebreaker count
  const { data: userIcebreakersData } = useReadContract({
    address: ICEBREAKER_CONTRACT_ADDRESS,
    abi: IcebreakerContractABI,
    functionName: "getUserResponseCount",
    args: address ? [address] : undefined,
  });

  const { data: userBadgesData } = useReadContract({
    address: VHIBES_BADGES_ADDRESS,
    abi: VhibesBadgesABI,
    functionName: "getUserBadges",
    args: address ? [address] : undefined,
  });

  // Fetch recent roasts
  const { data: recentRoastsData } = useReadContract({
    address: ROAST_ME_CONTRACT_ADDRESS,
    abi: RoastMeContractABI,
    functionName: "getRecentRoasts",
    args: [5], // Get last 5 roasts
  });

  // Fetch recent chain reactions
  const { data: recentChainReactionsData } = useReadContract({
    address: CHAIN_REACTION_CONTRACT_ADDRESS,
    abi: ChainReactionContractABI,
    functionName: "getRecentChains",
    args: [5], // Get last 5 chains
  });

  // Update data when contract data changes
  useEffect(() => {
    if (pointsData !== undefined) {
      setUserPoints(Number(pointsData));
    }
  }, [pointsData]);

  useEffect(() => {
    if (userRoastsData && Array.isArray(userRoastsData)) {
      setTotalRoasts(userRoastsData.length);
    }
  }, [userRoastsData]);

  useEffect(() => {
    if (userChainReactionsData && Array.isArray(userChainReactionsData)) {
      setTotalChainReactions(userChainReactionsData.length);
    }
  }, [userChainReactionsData]);

  useEffect(() => {
    if (userIcebreakersData !== undefined) {
      setTotalIcebreakers(Number(userIcebreakersData));
    }
  }, [userIcebreakersData]);

  useEffect(() => {
    if (userBadgesData && Array.isArray(userBadgesData)) {
      setUserBadges(userBadgesData.map(badge => Number(badge)));
    }
  }, [userBadgesData]);

  // Helper function to get time ago
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      return "Just now";
    }
  };

  // Generate fallback roasts data when contract data is not available
  const generateFallbackRoasts = (): RoastItem[] => {
    const titles = ["Epic Roast", "Viral Moment", "AI Comedy Gold", "Community Favorite", "Trending Roast"];
    return titles.map((title, index) => ({
      id: index + 1,
      title: `${title} #${index + 1}`,
      image: "/sample.png",
      likes: Math.floor(Math.random() * 200) + 10,
      timestamp: getTimeAgo(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      creator: "Community"
    }));
  };

  // Generate fallback chain reactions data when contract data is not available
  const generateFallbackChainReactions = (): ChainReactionItem[] => {
    const titles = ["Chain Challenge", "Viral Trend", "Community Challenge", "Trending Chain", "Epic Reaction"];
    return titles.map((title, index) => ({
      id: index + 1,
      title: `${title} #${index + 1}`,
      image: "/sample.png",
      likes: Math.floor(Math.random() * 300) + 50,
      timestamp: getTimeAgo(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      creator: "Community",
      participants: Math.floor(Math.random() * 20) + 5
    }));
  };

  // Process recent roasts data
  useEffect(() => {
    if (recentRoastsData && Array.isArray(recentRoastsData)) {
      const processedRoasts = recentRoastsData.map((roast: any, index: number) => ({
        id: Number(roast.id) || index + 1,
        title: roast.title || `Roast #${Number(roast.id) || index + 1}`,
        image: roast.imageUri || "/sample.png",
        likes: Number(roast.likes) || Math.floor(Math.random() * 200) + 10,
        timestamp: getTimeAgo(Number(roast.timestamp) || Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        creator: roast.creator || "Anonymous"
      }));
      setRecentRoasts(processedRoasts);
    } else {
      // Fallback to generated data if contract data is not available
      setRecentRoasts(generateFallbackRoasts());
    }
  }, [recentRoastsData]);

  // Process recent chain reactions data
  useEffect(() => {
    if (recentChainReactionsData && Array.isArray(recentChainReactionsData)) {
      const processedChains = recentChainReactionsData.map((chain: any, index: number) => ({
        id: Number(chain.id) || index + 1,
        title: chain.title || `Chain #${Number(chain.id) || index + 1}`,
        image: chain.imageUri || "/sample.png",
        likes: Number(chain.likes) || Math.floor(Math.random() * 300) + 50,
        timestamp: getTimeAgo(Number(chain.timestamp) || Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        creator: chain.creator || "Anonymous",
        participants: Number(chain.participants) || Math.floor(Math.random() * 20) + 5
      }));
      setRecentChainReactions(processedChains);
    } else {
      // Fallback to generated data if contract data is not available
      setRecentChainReactions(generateFallbackChainReactions());
    }
  }, [recentChainReactionsData]);

  // Load all badges with requirements and user progress
  useEffect(() => {
    const loadBadges = async () => {
      try {
        setIsLoadingBadges(true);
        
        // TODO: Implement dynamic badge fetching from IPFS
        // The admin page uploads badges to IPFS, but we need a way to discover them
        // This could be done through:
        // 1. A badge registry contract that stores metadata URIs
        // 2. A centralized IPFS collection
        // 3. Fetching from the admin contract's badge list
        
        // For now, use empty array - badges will be loaded dynamically
        const allBadges: BadgeData[] = [];
        
        console.log("TODO: Implement badge discovery from IPFS");

        setBadges(allBadges);
      } catch (error) {
        console.error("Error loading badges:", error);
      } finally {
        setIsLoadingBadges(false);
      }
    };

    if (address && totalRoasts !== undefined && totalChainReactions !== undefined && totalIcebreakers !== undefined) {
      loadBadges();
    }
  }, [address, totalRoasts, totalChainReactions, totalIcebreakers, userBadges]);

  // Get user level from smart contract
  const { data: userLevelData } = useReadContract({
    address: VHIBES_POINTS_ADDRESS,
    abi: VhibesPointsABI,
    functionName: "getUserLevel",
    args: address ? [address] : undefined,
  });

  const userLevel = userLevelData ? (userLevelData as [string, number])[0] : "Vibe Newbie";

  // Dynamic recent activities based on user's actual activity
  const generateRecentActivities = () => {
    const activities = [];
    
    // Add roast activity if user has roasts
    if (totalRoasts > 0) {
      activities.push({
        type: "roast",
        title: `Submitted ${totalRoasts} roast${totalRoasts > 1 ? 's' : ''}`,
        points: `+${totalRoasts * 10}`,
        timestamp: "Recently"
      });
    }
    
    // Add chain reaction activity if user has chains
    if (totalChainReactions > 0) {
      activities.push({
        type: "chain",
        title: `Started ${totalChainReactions} chain reaction${totalChainReactions > 1 ? 's' : ''}`,
        points: `+${totalChainReactions * 20}`,
        timestamp: "Recently"
      });
    }
    
    // Add icebreaker activity if user has icebreakers
    if (totalIcebreakers > 0) {
      activities.push({
        type: "icebreaker",
        title: `Answered ${totalIcebreakers} icebreaker${totalIcebreakers > 1 ? 's' : ''}`,
        points: `+${totalIcebreakers * 5}`,
        timestamp: "Recently"
      });
    }
    
    // Add points earned activity
    if (userPoints > 0) {
      activities.push({
        type: "points",
        title: `Earned ${userPoints} total points`,
        points: `+${userPoints}`,
        timestamp: "Total"
      });
    }
    
    // If no activities, show default message
    if (activities.length === 0) {
      activities.push({
        type: "welcome",
        title: "Welcome to vhibes!",
        points: "Start earning",
        timestamp: "Now"
      });
    }
    
    return activities;
  };

  const recentActivities = generateRecentActivities();

  // Handle badge minting
  const handleMintBadge = async (badgeId: number) => {
    if (!address) {
      alert("Please connect your wallet to mint badges");
      return;
    }

    try {
      // Call the mint function on the VhibesBadges contract
      writeContract({
        address: VHIBES_BADGES_ADDRESS,
        abi: VhibesBadgesABI,
        functionName: "mintBadge",
        args: [badgeId],
      });

      // Refresh badges after minting
      // This will be handled by the useEffect that watches userBadges
    } catch (error) {
      console.error("Error minting badge:", error);
      alert("Failed to mint badge. Please try again.");
    }
  };

  // Generate temporary access link for private IPFS badge images
  const getBadgeImageUrl = async (imageUri: string): Promise<string> => {
    try {
      // Extract CID from ipfs:// URI
      const cid = imageUri.replace('ipfs://', '');
      
      // For now, use the public gateway as fallback
      // In production, you'd generate a temporary access link
      return `${process.env.NEXT_PUBLIC_PINATA_GATEWAY}ipfs/${cid}`;
    } catch (error) {
      console.error("Error getting badge image URL:", error);
      return "/placeholder-badge.svg";
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-vhibes-lavender mb-2">Activity Dashboard</h2>
        <p className="text-sm md:text-base text-vhibes-light-purple">Track your vhibes journey and achievements</p>
      </div>

      {/* Main Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Points Card */}
        <div className="lg:col-span-1">
          <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-vhibes-lavender/20">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white">On-chain Points</h2>
              <button className="text-vhibes-lavender hover:text-vhibes-light-purple transition-colors">
                <RefreshCw size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-vhibes-lavender">{userPoints}</div>
                <div className="text-xs md:text-sm text-vhibes-light-purple">Total Points</div>
              </div>
              <div className="text-right">
                <div className="text-base md:text-lg font-bold text-vhibes-light-purple">{userLevel}</div>
                <div className="text-xs md:text-sm text-vhibes-light-purple">Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-vhibes-lavender/20">
            {/* Quick Stats - Inside the Recent Activity container, above the header */}
            <div className="bg-vhibes-dark/50 backdrop-blur-sm rounded-lg border border-vhibes-lavender/20 mb-4 md:mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4">
                <div className="p-2 md:p-3 text-center border-r border-vhibes-lavender/20 last:border-r-0">
                  <div className="text-lg md:text-xl font-bold text-vhibes-lavender">{totalRoasts}</div>
                  <div className="text-xs text-vhibes-light-purple">Total Roasts</div>
                </div>
                <div className="p-2 md:p-3 text-center border-r border-vhibes-lavender/20 last:border-r-0">
                  <div className="text-lg md:text-xl font-bold text-vhibes-lavender">{totalChainReactions}</div>
                  <div className="text-xs text-vhibes-light-purple">Chain Reactions</div>
                </div>
                <div className="p-2 md:p-3 text-center border-r border-vhibes-lavender/20 last:border-r-0">
                  <div className="text-lg md:text-xl font-bold text-vhibes-lavender">{totalIcebreakers}</div>
                  <div className="text-xs text-vhibes-light-purple">Icebreakers</div>
                </div>
                <div className="p-2 md:p-3 text-center border-r border-vhibes-lavender/20 last:border-r-0">
                  <div className="text-lg md:text-xl font-bold text-vhibes-lavender">{userBadges.length}</div>
                  <div className="text-xs text-vhibes-light-purple">Badges Earned</div>
                </div>
              </div>
            </div>

            <div className="mb-3 md:mb-4">
              <h2 className="text-lg md:text-xl font-bold text-white mb-2">Recent Activity</h2>
              <button 
                onClick={() => setActiveTab('leaderboard')}
                className="text-vhibes-lavender hover:text-vhibes-light-purple transition-colors text-xs md:text-sm"
              >
                View Leaderboard
              </button>
            </div>

            {/* Activity Filters */}
            <div className="flex flex-wrap gap-1 md:gap-2 mb-3 md:mb-4">
              <button
                onClick={() => setActivityFilter("all")}
                className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm transition-colors ${
                  activityFilter === "all"
                    ? "bg-vhibes-lavender text-vhibes-dark"
                    : "text-white hover:bg-vhibes-lavender/20"
                }`}
              >
                All ({recentActivities.length})
              </button>
              <button
                onClick={() => setActivityFilter("roast")}
                className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm transition-colors ${
                  activityFilter === "roast"
                    ? "bg-vhibes-lavender text-vhibes-dark"
                    : "text-white hover:bg-vhibes-lavender/20"
                }`}
              >
                Roasts
              </button>
              <button
                onClick={() => setActivityFilter("chain")}
                className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm transition-colors ${
                  activityFilter === "chain"
                    ? "bg-vhibes-lavender text-vhibes-dark"
                    : "text-white hover:bg-vhibes-lavender/20"
                }`}
              >
                Chains
              </button>
              <button
                onClick={() => setActivityFilter("points")}
                className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm transition-colors ${
                  activityFilter === "points"
                    ? "bg-vhibes-lavender text-vhibes-dark"
                    : "text-white hover:bg-vhibes-lavender/20"
                }`}
              >
                Points
              </button>
            </div>

            {/* Activity List */}
            <div className="space-y-2 md:space-y-3">
              {recentActivities
                .filter(activity => activityFilter === "all" || activity.type === activityFilter)
                .map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-vhibes-dark/50 border border-vhibes-lavender/20">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-vhibes-lavender/20 flex items-center justify-center">
                        {activity.type === "roast" && <Flame size={12} className="md:w-3.5 md:h-3.5 text-red-400" />}
                        {activity.type === "icebreaker" && <Snowflake size={12} className="md:w-3.5 md:h-3.5 text-blue-400" />}
                        {activity.type === "chain" && <Zap size={12} className="md:w-3.5 md:h-3.5 text-yellow-400" />}
                        {activity.type === "points" && <Trophy size={12} className="md:w-3.5 md:h-3.5 text-yellow-400" />}
                        {activity.type === "welcome" && <Sparkles size={12} className="md:w-3.5 md:h-3.5 text-vhibes-lavender" />}
                      </div>
                      <div>
                        <div className="text-sm md:text-base text-white font-medium">{activity.title}</div>
                        <div className="text-xs text-vhibes-light-purple">{activity.timestamp}</div>
                      </div>
                    </div>
                    <div className="text-sm md:text-base text-vhibes-lavender font-bold">{activity.points}</div>
                  </div>
                ))}
            </div>

            {/* Roast Gallery - Show only when roast filter is active */}
            {activityFilter === "roast" && (
              <div className="mt-4 md:mt-6">
                <h4 className="text-base md:text-lg font-semibold text-vhibes-lavender mb-3 md:mb-4">Recent Roasts</h4>
                <div className="space-y-2 md:space-y-3">
                  {recentRoasts.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-vhibes-dark/50 border border-vhibes-lavender/20">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-vhibes-lavender/20 flex items-center justify-center">
                        <Flame size={16} className="md:w-5 md:h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm md:text-base text-white font-medium">{item.title}</h4>
                        <div className="flex items-center gap-2 md:gap-4 text-xs text-vhibes-light-purple">
                          <span>{item.likes} likes</span>
                          <span>{item.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chain Gallery - Show only when chain filter is active */}
            {activityFilter === "chain" && (
              <div className="mt-4 md:mt-6">
                <h4 className="text-base md:text-lg font-semibold text-vhibes-lavender mb-3 md:mb-4">Chain Reactions</h4>
                <div className="space-y-2 md:space-y-3">
                  {recentChainReactions.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-vhibes-dark/50 border border-vhibes-lavender/20">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg bg-vhibes-lavender/20 flex items-center justify-center">
                        <Zap size={16} className="md:w-5 md:h-5 text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm md:text-base text-white font-medium">{item.title}</h4>
                        <div className="flex items-center gap-2 md:gap-4 text-xs text-vhibes-light-purple">
                          <span>{item.likes} likes</span>
                          <span>{item.timestamp}</span>
                          <span>{item.participants} participants</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="mt-6 md:mt-8">
        <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-vhibes-lavender/20">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-white">Your Badges</h2>
            <div className="text-xs md:text-sm text-vhibes-light-purple">
              {userBadges.length} of {badges.length} badges earned
            </div>
          </div>
          
          {isLoadingBadges ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vhibes-lavender mx-auto"></div>
              <p className="text-vhibes-light-purple mt-2">Loading badges...</p>
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-vhibes-light-purple">
                <p className="text-lg mb-2">No badges available yet</p>
                <p className="text-sm text-vhibes-lavender/70">
                  Admins need to upload badges to IPFS first
                </p>
                <p className="text-xs mt-2 text-vhibes-lavender/50">
                  Check the admin page to upload badge images
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`text-center p-3 md:p-4 rounded-lg border transition-all cursor-pointer ${
                    badge.isMinted
                ? 'bg-vhibes-lavender/20 border-vhibes-lavender text-white' 
                      : badge.isUnlocked
                      ? 'bg-vhibes-dark/50 border-vhibes-lavender text-white hover:bg-vhibes-lavender/10'
                : 'bg-vhibes-dark/50 border-vhibes-lavender/20 text-vhibes-lavender/50'
                  }`}
                  onClick={() => badge.isUnlocked && !badge.isMinted && handleMintBadge(badge.id)}
                  title={badge.isUnlocked && !badge.isMinted ? `Click to mint ${badge.name}` : badge.description}
                >
                  {/* Badge Icon with Blur Effect */}
                  <div className="relative mb-2">
                    {badge.isMinted ? (
                      // Show actual badge image when minted
                      <img
                        src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}ipfs/${badge.imageUri.replace('ipfs://', '')}`}
                        alt={badge.name}
                        className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-badge.svg";
                        }}
                      />
                    ) : badge.isUnlocked ? (
                      // Show unblurred image when unlocked but not minted
                      <img
                        src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}ipfs/${badge.imageUri.replace('ipfs://', '')}`}
                        alt={badge.name}
                        className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-badge.svg";
                        }}
                      />
                    ) : (
                      // Show blurred image when locked
                      <div className="relative">
                        <img
                          src={`${process.env.NEXT_PUBLIC_PINATA_GATEWAY}ipfs/${badge.imageUri.replace('ipfs://', '')}`}
                          alt={badge.name}
                          className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-lg filter blur-sm opacity-50"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-badge.svg";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock size={16} className="text-vhibes-lavender/50" />
                        </div>
                      </div>
                    )}
            </div>

                  {/* Badge Name */}
                  <div className="text-xs font-medium mb-1">{badge.name}</div>
                  
                  {/* Progress and Status */}
                  <div className="text-xs text-vhibes-light-purple">
                    {badge.isMinted ? (
                      <span className="text-green-400">âœ“ Minted</span>
                    ) : badge.isUnlocked ? (
                      <span className="text-yellow-400">Ready to Mint!</span>
                    ) : (
                      <span>{badge.currentValue}/{badge.requirementValue} {badge.requirement}</span>
                    )}
            </div>

                  {/* Rarity Badge */}
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      badge.rarity === 'Common' ? 'bg-gray-500/20 text-gray-300' :
                      badge.rarity === 'Uncommon' ? 'bg-green-500/20 text-green-300' :
                      badge.rarity === 'Rare' ? 'bg-blue-500/20 text-blue-300' :
                      badge.rarity === 'Epic' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {badge.rarity}
                    </span>
                  </div>
            </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
