"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TrendingUp, Trophy, Flame, Snowflake, Zap } from 'lucide-react';
import RoastMe from './RoastMe';
import Leaderboard from './Leaderboard';
import RoastGallery from './RoastGallery';
import ChainReactionGallery from './ChainReactionGallery';
import Icebreaker from './Icebreaker';
import Activity from './Activity';

export default function VhibesDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('activity');
  const [currentEmoji, setCurrentEmoji] = useState('🚀');

  // Rotate emojis every 5 seconds
  useEffect(() => {
    const emojis = ['🚀', '💎', '🔥', '⚡', '🎯', '✨', '🌟', '💫'];
    const interval = setInterval(() => {
      setCurrentEmoji(emojis[Math.floor(Math.random() * emojis.length)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-12 md:py-20">
        <div className="text-4xl md:text-6xl mb-4">{currentEmoji}</div>
        <h2 className="text-xl md:text-2xl font-bold text-vhibes-primary mb-4">Welcome to vhibes</h2>
        <p className="text-sm md:text-base text-vhibes-light">Connect your wallet to start vibing!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto overflow-x-hidden">
      {/* Welcome Section */}
      <div className="text-center py-6 md:py-10 lg:py-12 mb-6 md:mb-8">
        <div className="text-3xl md:text-4xl mb-4 animate-bounce">{currentEmoji}</div>
        <h1 className="text-2xl md:text-4xl font-bold mb-4">
          <span className="text-white">Gm </span>
          <span className="text-vhibes-primary">vhibes</span>
          <span className="text-white"> fam!</span>
        </h1>
        <p className="text-base md:text-xl text-vhibes-light mb-4 md:mb-6">
          Another day to roast, create & vibe! <br className="hidden md:block" />
          Share your <span className="font-bold text-vhibes-primary">epic moments and vibes</span> with your social community on X, Farcaster & beyond! 🚀✨
        </p>
        <div className="flex justify-center space-x-2 md:space-x-4 text-xs md:text-sm">
          <span className="bg-vhibes-primary/20 text-vhibes-primary px-2 md:px-3 py-1 rounded-full">
            Roast
          </span>
          <span className="bg-vhibes-primary/20 text-vhibes-primary px-2 md:px-3 py-1 rounded-full">
            Create
          </span>
          <span className="bg-vhibes-primary/20 text-vhibes-primary px-2 md:px-3 py-1 rounded-full">
            Connect
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-6 md:mb-8">
        <div className="flex flex-wrap justify-center space-x-1 bg-vhibes-dark/30 backdrop-blur-sm rounded-lg p-1 border border-vhibes-primary/20 shadow-md">
          {[
            { 
              id: 'activity', 
              label: 'Activity', 
              icon: TrendingUp 
            },
            { 
              id: 'roastme', 
              label: 'Roast Me', 
              icon: Flame 
            },
            { 
              id: 'icebreaker', 
              label: 'Icebreaker', 
              icon: Snowflake 
            },
            { 
              id: 'chainreaction', 
              label: 'Chain Reaction', 
              icon: Zap 
            },
            { 
              id: 'leaderboard', 
              label: 'Leaderboard', 
              icon: Trophy 
            },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-6 py-2 md:py-3 rounded-md transition-colors font-medium text-xs md:text-sm relative group ${
                  activeTab === tab.id
                    ? 'bg-vhibes-primary text-white'
                    : 'text-vhibes-light hover:text-vhibes-primary'
                }`}
                title={tab.label}
              >
                {/* Mobile: Show icon only */}
                <div className="md:hidden">
                  <IconComponent className="text-lg" />
                </div>
                
                {/* Desktop: Show text */}
                <div className="hidden md:block">
                  {tab.label}
                </div>
                
                {/* Mobile tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-vhibes-dark text-vhibes-primary text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap md:hidden">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - Centralized with consistent max-width */}
      <div className="w-full overflow-x-hidden">
        {activeTab === 'activity' && (
          <div className="w-full max-w-6xl mx-auto">
            <Activity setActiveTab={setActiveTab} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg border border-vhibes-primary/20 p-4 md:p-6">
              <Leaderboard />
            </div>
          </div>
        )}

        {activeTab === 'roastme' && (
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg border border-vhibes-primary/20 p-4 md:p-6">
              <RoastMe />
            </div>
          </div>
        )}

        {activeTab === 'icebreaker' && (
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg border border-vhibes-primary/20 p-4 md:p-6">
              <Icebreaker />
            </div>
          </div>
        )}

        {activeTab === 'chainreaction' && (
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-vhibes-dark/30 backdrop-blur-sm rounded-lg border border-vhibes-primary/20 p-4 md:p-6">
              <ChainReactionGallery />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

