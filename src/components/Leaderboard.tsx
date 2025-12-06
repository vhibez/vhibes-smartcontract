"use client";

import { Wrench, Hammer, Trophy } from "lucide-react";

export default function Leaderboard() {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-vhibes-dark/30 backdrop-blur-sm rounded-full border border-vhibes-primary/20 flex items-center justify-center">
          <Wrench size={32} className="text-vhibes-primary" />
        </div>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-vhibes-primary mb-4 flex items-center justify-center gap-2">
        <Trophy className="w-6 h-6 md:w-8 md:h-8" />
        Leaderboard
      </h2>
      <p className="text-sm md:text-lg text-vhibes-light mb-6">We're crafting something legendary!</p>
      
      <div className="flex justify-center items-center gap-2 text-vhibes-light">
        <Hammer size={16} />
        <span className="text-xs md:text-sm">Epic rankings, legendary rewards, and viral fame await!</span>
      </div>
    </div>
  );
}

