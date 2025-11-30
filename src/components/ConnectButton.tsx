"use client";

import { useAccount, useConnectors, useConnect } from "wagmi";
import { WalletModal, WalletConnection } from "@/contexts/wallet";
import { useEffect, useState } from "react";
import { useMiniKit } from '@coinbase/onchainkit/minikit';

export default function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const [isInFarcasterFrame, setIsInFarcasterFrame] = useState(false);
  const { isFrameReady } = useMiniKit();

  // Check if we're in a Farcaster Frame context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inFrame = window.location.href.includes('farcaster') || 
                     navigator.userAgent.includes('Farcaster') ||
                     window.location.href.includes('warpcast') ||
                     navigator.userAgent.includes('Warpcast') ||
                     window.location.href.includes('miniapps') ||
                     window.location.href.includes('oXpRXDCzmUMJ') ||
                     window.location.href.includes('vibecasters') ||
                     window.location.search.includes('farcaster') ||
                     (window as any).farcaster ||
                     (window as any).warpcast ||
                     (window as any).miniapp ||
                     window.location.href.includes('farcaster.xyz/miniapps');
      
      setIsInFarcasterFrame(inFrame);
      
      // Auto-connect to Farcaster if in Farcaster Frame and not already connected
      if (inFrame && !isConnected && isFrameReady) {
        const farcasterConnector = connectors.find(
          (connector) => 
            connector.id === "farcaster" || 
            connector.name?.toLowerCase().includes('farcaster') ||
            connector.name?.toLowerCase().includes('miniapp') ||
            connector.uid?.includes('farcaster')
        );
        
        if (farcasterConnector) {
          console.log('Auto-connecting to Farcaster...');
          connect({ connector: farcasterConnector });
        }
      }
    }
  }, [connectors, connect, isConnected, isFrameReady]);

  // If connected, show wallet connection component
  if (isConnected && address) {
    return <WalletConnection />;
  }

  // If in Farcaster Frame, use your custom WalletModal (preserves Farcaster UX)
  if (isInFarcasterFrame) {
    return <WalletModal />;
  }

  // If not in Farcaster Frame, use AppKit button (qualifies for Builder Rewards)
  return <appkit-button />;
}

