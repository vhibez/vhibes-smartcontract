"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useState, useRef, useEffect } from "react";
import { useConnectors, useAccount, useConnect } from "wagmi";
import { ExternalLink } from "lucide-react";

const WalletModal = () => {
  const connectors = useConnectors();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [pendingConnectorUID, setPendingConnectorUID] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInFarcasterFrame, setIsInFarcasterFrame] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
    
    // Check if we're in a Farcaster Frame context
    const checkFarcasterFrame = () => {
      if (typeof window !== 'undefined') {
        // More comprehensive Farcaster Frame detection
        const inFrame = window.location.href.includes('farcaster') || 
                       navigator.userAgent.includes('Farcaster') ||
                       window.location.href.includes('warpcast') ||
                       navigator.userAgent.includes('Warpcast') ||
                       window.location.href.includes('miniapps') ||
                       window.location.href.includes('oXpRXDCzmUMJ') ||
                       window.location.href.includes('vibecasters') ||
                       // Check for Farcaster-specific query parameters
                       window.location.search.includes('farcaster') ||
                       // Check for Farcaster-specific headers or context
                       (window as any).farcaster ||
                       (window as any).warpcast ||
                       // Check for Mini App specific context
                       (window as any).miniapp ||
                       // Check for specific VibeCaster Mini App
                       window.location.href.includes('farcaster.xyz/miniapps');
        
        setIsInFarcasterFrame(inFrame);
      }
    };
    
    checkFarcasterFrame();
  }, []);

  // Monitor connection state and close modal when connected
  useEffect(() => {
    if (isConnected && address) {
      setIsModalOpen(false);
    }
  }, [isConnected, address]);

  // Remove duplicates and filter connectors
  const uniqueConnectors = Array.from(
    new Map(connectors.map((c) => [c.name, c])).values()
  );

  // Find Farcaster connector and prioritize it
  const farcasterConnector = uniqueConnectors.find(
    (connector) => 
      connector.id === "farcaster" || 
      connector.name?.toLowerCase().includes('farcaster') ||
      connector.name?.toLowerCase().includes('miniapp') ||
      connector.uid?.includes('farcaster')
  );
  
  const walletConnectConnector = uniqueConnectors.find(
    (connector) => connector.id === "walletConnect"
  );
  
  const otherConnectors = uniqueConnectors.filter(
    (connector) => 
      connector.id !== "walletConnect" && 
      connector.id !== "farcaster" && 
      !connector.name?.toLowerCase().includes('farcaster')
  );

  // Helper function to get wallet icon with better fallbacks
  const getWalletIcon = (connector: any) => {
    // Special handling for Farcaster
    if (connector.id === "farcaster" || connector.name?.toLowerCase().includes('farcaster')) {
      return "/farcaster.svg";
    }
    
    // Special handling for WalletConnect
    if (connector.id === "walletConnect") {
      return "https://avatars.githubusercontent.com/u/37784886?s=200&v=4";
    }

    // Special handling for MetaMask if it's not working
    if (connector.id === "metaMaskSDK" || connector.name?.toLowerCase().includes('metamask')) {
      return "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
    }

    // Special handling for Coinbase Wallet
    if (connector.id === "coinbaseWalletSDK" || connector.name?.toLowerCase().includes('coinbase')) {
      return "https://avatars.githubusercontent.com/u/18060234?s=200&v=4";
    }

    // If connector provides a base64 or URL icon
    if (connector.icon) {
      if (typeof connector.icon === "string") {
        return connector.icon;
      }
      if (connector.icon?.url) {
        return connector.icon.url;
      }
    }

    // Default generic Ethereum icon
    return "https://cdn.iconscout.com/icon/free/png-256/ethereum-2752194-2285011.png";
  };

  const connectWallet = async (connector: any) => {
    try {
      const isFarcasterConnector = connector.id === "farcaster" || 
                                   connector.name?.toLowerCase().includes('farcaster') ||
                                   connector.name?.toLowerCase().includes('miniapp');
      
      // Check if this is the Farcaster connector and we're not in a Farcaster Frame
      if (isFarcasterConnector && !isInFarcasterFrame) {
        alert('Farcaster wallet connection is only available when using this app within Farcaster. Please open this app in Farcaster to connect your wallet.');
        return;
      }
      
      setPendingConnectorUID(connector.uid);

      // Persist the selected connector so we can auto-reconnect on next visit
      try {
        const key = connector.id ?? connector.name ?? connector.uid ?? 'unknown';
        if (typeof window !== 'undefined' && key) {
          window.localStorage.setItem('vhibes:lastConnector', key);
        }
      } catch (e) {
        // ignore storage errors
      }

      // Use the connect function from useConnect hook
      connect({ connector });

      setIsModalOpen(false); // Close modal on successful connection
    } catch (error) {
      console.error('Connection error:', error);
      if (error instanceof Error) {
        alert(`Connection failed: ${error.message}`);
      } else {
        alert('Connection failed. Please try again.');
      }
    } finally {
      setPendingConnectorUID(null);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsModalOpen(!isModalOpen)}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#3CA2A6] px-4 py-2 font-semibold text-white transition-transform hover:scale-105 hover:bg-[#A2E2CD]"
      >
        Connect Wallet
      </button>

      {isModalOpen && (
        <>
          {/* Modal */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 origin-top-right rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 shadow-lg md:max-w-none md:border-none md:shadow-none md:p-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#222222]">Connect a Wallet</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#666666] hover:text-[#222222]"
                >
                  <Icon icon="lucide:x" className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Helpful message for Farcaster users */}
                {!isInFarcasterFrame && farcasterConnector && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 <strong>Want to use Farcaster Wallet?</strong> Open this app in Farcaster to connect your wallet automatically.
                    </p>
                  </div>
                )}

                {/* Farcaster as the primary option */}
                {farcasterConnector && (
                  <div className="mb-4">
                    <h3 className="text-[#666666] text-xs font-medium mb-2">
                      Recommended for Farcaster
                    </h3>
                    <button
                      onClick={() => connectWallet(farcasterConnector)}
                      disabled={pendingConnectorUID === farcasterConnector.uid}
                      className={`w-full flex gap-4 items-center p-4 border-2 rounded-xl transition-all ${
                        isInFarcasterFrame 
                          ? 'bg-gradient-to-r from-[#A2E2CD]/20 to-[#CCC675]/20 border-[#3CA2A6]/30 hover:bg-gradient-to-r hover:from-[#A2E2CD]/30 hover:to-[#CCC675]/30' 
                          : 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <img
                        src={getWalletIcon(farcasterConnector)}
                        className="w-8 h-8"
                        alt="Farcaster"
                        onError={(e) => console.error('Farcaster icon failed to load:', e.currentTarget.src)}
                      />
                      <div className="flex-1 text-left">
                        <span className="text-[#222222] font-semibold">Farcaster Wallet</span>
                        <div className="text-xs text-[#666666]">
                          {isInFarcasterFrame 
                            ? 'Connect with your Farcaster account' 
                            : 'Only available in Farcaster Frame'
                          }
                        </div>
                      </div>

                      {pendingConnectorUID === farcasterConnector.uid && (
                        <Icon
                          icon="eos-icons:loading"
                          className="w-4 h-4 ml-auto animate-spin"
                        />
                      )}
                    </button>
                  </div>
                )}

                {/* Only show other wallets when NOT in Farcaster Frame */}
                {!isInFarcasterFrame && (
                  <>
                    {walletConnectConnector && (
                      <button
                        onClick={() => connectWallet(walletConnectConnector)}
                        disabled={pendingConnectorUID === walletConnectConnector.uid}
                        className="w-full flex gap-4 items-center p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all"
                      >
                        <img
                          src={getWalletIcon(walletConnectConnector)}
                          className="w-6 h-6"
                          alt="WalletConnect"
                          onError={(e) => console.error('WalletConnect icon failed to load:', e.currentTarget.src)}
                        />
                        <span className="text-[#222222] text-sm">WalletConnect</span>

                        {pendingConnectorUID === walletConnectConnector.uid && (
                          <Icon
                            icon="eos-icons:loading"
                            className="w-4 h-4 ml-auto animate-spin"
                          />
                        )}
                      </button>
                    )}

                    <h3 className="text-[#666666] text-xs font-medium">
                      Other Wallets
                    </h3>

                    <div className="grid grid-cols-3 gap-1">
                      {otherConnectors.map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => connectWallet(connector)}
                          disabled={pendingConnectorUID === connector.uid}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                        >
                          <img
                            src={getWalletIcon(connector)}
                            className="w-8 h-8 bg-white p-1 rounded-md"
                            alt={connector.name}
                            onError={(e) => console.error(`${connector.name} icon failed to load:`, e.currentTarget.src)}
                          />
                          <span className="text-[10px] text-[#222222]">
                            {connector.name}
                          </span>

                          {pendingConnectorUID === connector.uid && (
                            <Icon
                              icon="eos-icons:loading"
                              className="w-3 h-3 animate-spin"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <a
                        href="https://ethereum.org/en/wallets/find-wallet/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-xs text-[#3CA2A6] hover:text-[#A2E2CD] hover:underline"
                      >
                        <span>Don't have a wallet? Get one here</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </>
                )}
              </div>

              <p className="text-[#666666] text-[10px] mt-3 text-center">
                By connecting a wallet, you agree to vhibes's Terms of
                Service
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletModal;

