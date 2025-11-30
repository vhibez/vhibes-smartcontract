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

      {/* Main vhibes Dashboard */}
      <div className="flex-1">
        <VhibesDashboard />
      </div>

      {/* vhibes Footer */}
      <Footer />
    </div>
  );
}
