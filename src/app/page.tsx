"use client";

import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VhibesDashboard from "../components/VhibesDashboard";
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

      {/* Main vhibes Dashboard - Centralized Layout */}
      <div className="flex-1 w-full">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          <VhibesDashboard />
        </div>
        </div>

      {/* vhibes Footer */}
      <Footer />
    </div>
  );
}
