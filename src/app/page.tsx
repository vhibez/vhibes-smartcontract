"use client";

import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { useEffect } from 'react';

export default function Home() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  return (
    <div className="min-h-screen vibecaster-bg flex flex-col">
      {/* vhibes Header */}
      <Header />

      {/* Main vhibes Dashboard */}
      <div className="flex-1 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to vhibes
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              The Future of Social on Farcaster
            </p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              AI roasts, icebreakers, and viral challenges - all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* vhibes Footer */}
      <Footer />
    </div>
  );
}
