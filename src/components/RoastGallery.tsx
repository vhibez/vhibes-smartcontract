"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Flame, Heart, MessageCircle, Share2, Loader2, Filter, ArrowUpDown } from "lucide-react";
import Image from "next/image";

export default function RoastGallery() {
  const { address, isConnected } = useAccount();
  const [roasts, setRoasts] = useState<Array<{
    id: string;
    userAddress: string;
    image: string;
    roast: string;
    timestamp: Date;
    likes: number;
    comments: number;
    isLiked: boolean;
    isCurrentUser: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, trending, recent
  const [sortBy, setSortBy] = useState("recent"); // recent, popular, oldest

  // Mock roast data - in real implementation, this would come from contract events
  useEffect(() => {
    const mockRoasts = [
      {
        id: "1",
        userAddress: "0x1234...5678",
        image: "/sample.png",
        roast: "Looking at this photo, I can see why your camera has trust issues. It's like you're trying to win an award for 'Most Confusing Selfie Angle'! 😂",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        likes: 42,
        comments: 8,
        isLiked: false,
        isCurrentUser: false
      },
      {
        id: "2",
        userAddress: "0x8765...4321",
        image: "/sample.png",
        roast: "This picture is giving me strong 'I just woke up and this is fine' energy. Your confidence is admirable, even if your photography skills aren't! 🔥",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        likes: 89,
        comments: 15,
        isLiked: false,
        isCurrentUser: false
      },
      {
        id: "3",
        userAddress: "0x9876...5432",
        image: "/sample.png",
        roast: "I've seen better lighting in a cave. Are you trying to start a new trend called 'mystery person chic'? Because it's working... for all the wrong reasons! 💀",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        likes: 156,
        comments: 23,
        isLiked: false,
        isCurrentUser: false
      },
      {
        id: "4",
        userAddress: "0x5432...1098",
        image: "/sample.png",
        roast: "This selfie is so blurry, I thought it was modern art. Picasso would be proud, but your followers might be confused! 🎨",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        likes: 67,
        comments: 12,
        isLiked: false,
        isCurrentUser: false
      },
      {
        id: "5",
        userAddress: "0x6789...0123",
        image: "/sample.png",
        roast: "Your expression is giving me 'I just realized I left the stove on' vibes. The panic is real, and so is my concern! 😅",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        likes: 234,
        comments: 31,
        isLiked: false,
        isCurrentUser: false
      },
      {
        id: "6",
        userAddress: "0x3456...7890",
        image: "/sample.png",
        roast: "This photo is so dark, I thought you were trying to audition for a horror movie. The mysterious vibes are strong with this one! 👻",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        likes: 98,
        comments: 18,
        isLiked: false,
        isCurrentUser: false
      }
    ];

    // Mark current user's roasts if connected
    if (isConnected && address) {
      mockRoasts.forEach(roast => {
        if (roast.userAddress === `${address.slice(0, 6)}...${address.slice(-4)}`) {
          roast.isCurrentUser = true;
        }
      });
    }

    setRoasts(mockRoasts);
    setIsLoading(false);
  }, [isConnected, address]);

  const handleLike = (roastId: string) => {
    setRoasts(prev => prev.map(roast => {
      if (roast.id === roastId) {
        return {
          ...roast,
          likes: roast.isLiked ? roast.likes - 1 : roast.likes + 1,
          isLiked: !roast.isLiked
        };
      }
      return roast;
    }));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="animate-spin w-10 h-10 text-vhibes-primary mx-auto mb-4" />
          <p className="text-vhibes-light">Loading roast gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Flame className="text-red-500" />
          Roast Gallery
        </h2>
        <p className="text-vhibes-light">
          Check out the funniest roasts from the vhibes community! Vote for your favorites! 🔥
        </p>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex bg-vhibes-dark/20 rounded-lg p-1">
          {[
            { id: "all", label: "All Roasts", icon: Flame },
            { id: "trending", label: "Trending", icon: Heart },
            { id: "recent", label: "Recent", icon: MessageCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  filter === tab.id
                    ? "bg-vhibes-primary text-white"
                    : "text-vhibes-light hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="text-vhibes-light" size={16} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-vhibes-dark/20 border border-vhibes-primary/20 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Roast Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roasts.map((roast) => (
          <div
            key={roast.id}
            className={`vhibes-card p-4 transition-all duration-300 hover:shadow-lg hover:shadow-vhibes-primary/10 ${
              roast.isCurrentUser ? "ring-2 ring-vhibes-primary/50" : ""
            }`}
          >
            {/* User Info */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-vhibes-dark rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {roast.userAddress.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-white text-sm font-medium">{roast.userAddress}</span>
                {roast.isCurrentUser && (
                  <span className="text-xs bg-vhibes-primary text-white px-2 py-1 rounded-full">
                    YOU
                  </span>
                )}
              </div>
              <span className="text-xs text-vhibes-light">{formatTimeAgo(roast.timestamp)}</span>
            </div>

            {/* Roast Image */}
            <div className="relative mb-3">
              <Image
                src={roast.image}
                alt="Roast selfie"
                width={300}
                height={300}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 right-2">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Flame size={14} className="text-red-400" />
                </div>
              </div>
            </div>

            {/* Roast Text */}
            <p className="text-white text-sm mb-4 line-clamp-3 leading-relaxed">
              {roast.roast}
            </p>

            {/* Interaction Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(roast.id)}
                  className={`flex items-center gap-1 transition-colors ${
                    roast.isLiked
                      ? "text-red-500"
                      : "text-vhibes-light hover:text-red-500"
                  }`}
                >
                  <Heart size={14} />
                  <span className="text-xs">{roast.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-vhibes-light hover:text-white transition-colors">
                  <MessageCircle size={14} />
                  <span className="text-xs">{roast.comments}</span>
                </button>
              </div>
              <button className="text-vhibes-light hover:text-white transition-colors">
                <Share2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center">
        <button className="bg-vhibes-primary hover:bg-vhibes-primary/80 text-white px-6 py-3 rounded-lg transition-colors">
          Load More Roasts
        </button>
      </div>
    </div>
  );
}

