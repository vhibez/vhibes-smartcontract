"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Zap, Heart, MessageCircle, Share2, Loader2, Filter, ArrowUpDown, Link, Users, Camera, Upload, X, CheckCircle, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import ChainReactionContractArtifact from '@/abis/ChainReactionContract.json';
import { uploadChainToIPFS } from '@/lib/ipfs';

// Contract address from deployment (Base Mainnet)
import { CHAIN_REACTION_CONTRACT_ADDRESS } from "@/lib/constants";

interface Challenge {
  initiator: string;
  prompt: string;
  promptImageIpfsHash: string;
  timestamp: bigint;
  responseIds: bigint[];
  exists: boolean;
}

interface Response {
  responder: string;
  parentChallengeId: bigint;
  parentResponseId: bigint;
  responseText: string;
  responseImageIpfsHash: string;
  timestamp: bigint;
  childResponseIds: bigint[];
  exists: boolean;
}

export default function ChainReactionGallery() {
  const { address, isConnected } = useAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'challenges' | 'create'>('challenges');
  const [challenges, setChallenges] = useState<Array<{ id: number; data: Challenge }>>([]);
  const [responses, setResponses] = useState<Array<{ id: number; data: Response }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, trending
  const [sortBy, setSortBy] = useState("recent"); // recent, popular, responses

  // Form states
  const [promptText, setPromptText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [responseText, setResponseText] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null);
  const [selectedParentResponseId, setSelectedParentResponseId] = useState<number | null>(null);

  // Read contract data
  const { data: totalChallenges } = useReadContract({
    address: CHAIN_REACTION_CONTRACT_ADDRESS as `0x${string}`,
    abi: ChainReactionContractArtifact.abi,
    functionName: 'totalChallenges',
  });

  const { data: totalResponses } = useReadContract({
    address: CHAIN_REACTION_CONTRACT_ADDRESS as `0x${string}`,
    abi: ChainReactionContractArtifact.abi,
    functionName: 'totalResponses',
  });

  // Write contract functions
  const { writeContract: startChallenge, data: startChallengeHash } = useWriteContract();
  const { writeContract: joinChallenge, data: joinChallengeHash } = useWriteContract();

  // Wait for transactions
  const { isLoading: isCreatingChallenge } = useWaitForTransactionReceipt({ hash: startChallengeHash });
  const { isLoading: isJoiningChallenge } = useWaitForTransactionReceipt({ hash: joinChallengeHash });

  // Load challenges
  useEffect(() => {
    const loadChallenges = async () => {
      if (totalChallenges && typeof totalChallenges === 'bigint' && totalChallenges > 0n) {
        try {
          const challengesData = await fetch(`/api/chainreaction/challenges?total=${totalChallenges.toString()}`);
          const challengesList = await challengesData.json();
          setChallenges(challengesList);
        } catch (error) {
          console.error('Error loading challenges:', error);
        }
      }
      setIsLoading(false);
    };
    loadChallenges();
  }, [totalChallenges]);

  // Load responses
  useEffect(() => {
    const loadResponses = async () => {
      if (totalResponses && typeof totalResponses === 'bigint' && totalResponses > 0n) {
        try {
          const responsesData = await fetch(`/api/chainreaction/responses?total=${totalResponses.toString()}`);
          const responsesList = await responsesData.json();
          setResponses(responsesList);
        } catch (error) {
          console.error('Error loading responses:', error);
        }
      }
    };
    loadResponses();
  }, [totalResponses]);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    // This would integrate with camera API in a real implementation
    alert('Camera capture feature coming soon!');
  };

  // Create challenge
  const handleCreateChallenge = async () => {
    if (!promptText.trim()) {
      alert('Please enter a prompt');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      let imageHash = '';
      if (selectedImage) {
        const uploadResult = await uploadChainToIPFS(selectedImage, promptText);
        imageHash = uploadResult.imageHash;
      }

      startChallenge({
        address: CHAIN_REACTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: ChainReactionContractArtifact.abi,
        functionName: 'startChallenge',
        args: [promptText, imageHash],
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge. Please try again.');
    }
  };

  // Join challenge
  const handleJoinChallenge = async () => {
    if (!responseText.trim() && !selectedImage) {
      alert('Please enter a response or upload an image');
      return;
    }

    if (!selectedChallengeId) {
      alert('Please select a challenge to join');
      return;
    }

    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      let imageHash = '';
      if (selectedImage) {
        const uploadResult = await uploadChainToIPFS(selectedImage, responseText);
        imageHash = uploadResult.imageHash;
      }

      joinChallenge({
        address: CHAIN_REACTION_CONTRACT_ADDRESS as `0x${string}`,
        abi: ChainReactionContractArtifact.abi,
        functionName: 'joinChallenge',
        args: [BigInt(selectedChallengeId), BigInt(selectedParentResponseId || 0), responseText, imageHash],
      });
    } catch (error) {
      console.error('Error joining challenge:', error);
      alert('Failed to join challenge. Please try again.');
    }
  };

  // Clear form
  const clearForm = () => {
    setPromptText('');
    setSelectedImage(null);
    setImagePreview('');
    setResponseText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTimeAgo = (timestamp: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diffInSeconds = now - timestamp;
    const diffInHours = Number(diffInSeconds) / 3600;
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getResponseCount = (challengeId: number) => {
    return responses.filter(r => Number(r.data.parentChallengeId) === challengeId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 md:py-12">
        <div className="text-center">
          <Loader2 className="animate-spin w-8 h-8 md:w-10 md:h-10 text-vhibes-primary mx-auto mb-3 md:mb-4" />
          <p className="text-sm md:text-base text-vhibes-light-purple">âš¡ Loading viral chain reactions... ðŸ”¥</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Zap className="text-yellow-500" />
          Chain Reactions
        </h2>
        <p className="text-sm md:text-base text-vhibes-light-purple">
          Start viral challenges and watch them spread like wildfire! Join the fun and create epic chain reactions!
        </p>
      </div>

      {/* Stats */}
      <div className="flex justify-center">
        <div className="bg-vhibes-dark/50 backdrop-blur-sm rounded-lg border border-vhibes-lavender/20">
          <div className="flex">
            <div className="px-3 md:px-4 py-2 md:py-3 text-center border-r border-vhibes-lavender/20">
              <p className="text-lg md:text-xl font-bold text-vhibes-lavender">{totalChallenges?.toString() || '0'}</p>
              <p className="text-xs text-vhibes-light-purple">Viral Challenges</p>
            </div>
            <div className="px-3 md:px-4 py-2 md:py-3 text-center border-r border-vhibes-lavender/20">
              <p className="text-lg md:text-xl font-bold text-vhibes-lavender">{totalResponses?.toString() || '0'}</p>
              <p className="text-xs text-vhibes-light-purple">Epic Responses</p>
            </div>
            <div className="px-3 md:px-4 py-2 md:py-3 text-center border-r border-vhibes-lavender/20 last:border-r-0">
              <p className="text-lg md:text-xl font-bold text-vhibes-lavender">{challenges.length}</p>
              <p className="text-xs text-vhibes-light-purple">Active Chains</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-vhibes-dark/30 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-2 md:px-4 rounded-md transition-colors text-sm md:text-base ${
            activeTab === 'create'
              ? 'bg-vhibes-lavender text-vhibes-dark'
              : 'text-vhibes-light-purple hover:text-vhibes-lavender'
          }`}
        >
          ðŸš€ Launch Challenge
        </button>
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 py-2 px-2 md:px-4 rounded-md transition-colors text-sm md:text-base ${
            activeTab === 'challenges'
              ? 'bg-vhibes-lavender text-vhibes-dark'
              : 'text-vhibes-light-purple hover:text-vhibes-lavender'
          }`}
        >
          ðŸ”¥ Viral Challenges
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div className="space-y-4">
            {challenges.length === 0 ? (
              <p className="text-sm md:text-base text-vhibes-light-purple text-center py-6 md:py-8">No challenges yet. Launch one to start the viral wave! ðŸš€</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg p-3 md:p-4 border border-vhibes-lavender/20">
                    {/* Challenge Image */}
                    {challenge.data.promptImageIpfsHash && (
                      <div className="relative mb-3">
                        <Image
                          src={`https://gateway.pinata.cloud/ipfs/${challenge.data.promptImageIpfsHash}`}
                          alt="Challenge"
                          width={300}
                          height={200}
                          className="w-full h-24 md:h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <Zap size={12} className="md:w-3.5 md:h-3.5 text-yellow-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Challenge Info */}
                    <h4 className="text-sm md:text-base text-white font-semibold mb-2">{challenge.data.prompt}</h4>
                    <p className="text-xs text-vhibes-light-purple mb-2 md:mb-3">
                      by {challenge.data.initiator.slice(0, 6)}...{challenge.data.initiator.slice(-4)}
                    </p>
                    <p className="text-xs text-vhibes-light-purple mb-2 md:mb-3">
                      {formatTimeAgo(challenge.data.timestamp)}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-vhibes-light-purple">
                        {getResponseCount(challenge.id)} responses
                      </span>
                    </div>

                    {/* Join Button */}
                    <button
                      onClick={() => {
                        setSelectedChallengeId(challenge.id);
                        setSelectedParentResponseId(null);
                      }}
                      className="w-full bg-vhibes-lavender text-vhibes-dark px-3 md:px-4 py-2 rounded-md hover:bg-vhibes-light-purple transition-colors text-sm md:text-base"
                    >
                      âš¡ Join the Chain
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-semibold text-vhibes-lavender mb-3 md:mb-4">Launch Viral Challenge</h3>
              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm md:text-base text-vhibes-light-purple mb-2">Challenge Prompt</label>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Drop your viral challenge here... ðŸ”¥"
                    className="w-full bg-vhibes-dark/50 border border-vhibes-lavender/20 rounded-md px-3 py-2 text-sm md:text-base text-vhibes-lavender focus:outline-none focus:border-vhibes-lavender resize-none"
                    rows={3}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm md:text-base text-vhibes-light-purple mb-2">Challenge Image (Optional)</label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative mb-4">
                      <Image
                        src={imagePreview}
                        alt="Selected image"
                        width={300}
                        height={200}
                        className="w-full h-24 md:h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={clearForm}
                        className="absolute top-2 right-2 w-6 h-6 md:w-8 md:h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X size={12} className="md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Upload Buttons */}
                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={handleCameraCapture}
                      className="flex-1 bg-vhibes-lavender hover:bg-vhibes-lavender/80 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Camera size={14} className="md:w-4 md:h-4" />
                      Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-vhibes-purple-dark hover:bg-vhibes-purple-dark/80 text-white px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Upload size={14} className="md:w-4 md:h-4" />
                      Upload
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>

                <button
                  onClick={handleCreateChallenge}
                  disabled={isCreatingChallenge}
                  className="w-full bg-vhibes-lavender text-vhibes-dark py-2 rounded-md hover:bg-vhibes-light-purple transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  {isCreatingChallenge ? 'ðŸš€ Launching...' : 'ðŸš€ Launch Viral Challenge'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Join Challenge Modal */}
      {selectedChallengeId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-vhibes-dark rounded-lg p-4 md:p-6 w-full max-w-md">
            <h3 className="text-lg md:text-xl font-semibold text-vhibes-lavender mb-3 md:mb-4">âš¡ Join the Chain</h3>
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm md:text-base text-vhibes-light-purple mb-2">Your Epic Response</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Drop your epic response here... ðŸ”¥"
                  className="w-full bg-vhibes-dark/50 border border-vhibes-lavender/20 rounded-md px-3 py-2 text-sm md:text-base text-vhibes-lavender focus:outline-none focus:border-vhibes-lavender resize-none"
                  rows={4}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedChallengeId(null);
                    setResponseText('');
                  }}
                  className="flex-1 bg-vhibes-purple-dark text-vhibes-lavender py-2 rounded-md hover:bg-vhibes-dark transition-colors text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinChallenge}
                  disabled={isJoiningChallenge}
                  className="flex-1 bg-vhibes-lavender text-vhibes-dark py-2 rounded-md hover:bg-vhibes-light-purple transition-colors disabled:opacity-50 text-sm md:text-base"
                >
                  {isJoiningChallenge ? 'âš¡ Joining...' : 'âš¡ Join the Chain'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
