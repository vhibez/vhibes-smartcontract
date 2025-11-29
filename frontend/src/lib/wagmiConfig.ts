// src/lib/wagmiConfig.ts
import { createConfig, http } from "wagmi";
// import { baseSepolia } from "wagmi/chains"; // Base Sepolia - commented out
import { base } from "wagmi/chains"; // Base Mainnet
import {
  injected,
  walletConnect,
  metaMask,
  coinbaseWallet,
} from "wagmi/connectors";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { CURRENT_NETWORK, APP_URLS } from "./constants";

// Create WalletConnect connector only once
let walletConnectConnector: any = null;

const getWalletConnectConnector = () => {
  if (!walletConnectConnector) {
    walletConnectConnector = walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
      metadata: {
        name: "vhibes",
        description: "The Future of Social on Farcaster - AI roasts, icebreakers, and viral challenges",
        url: APP_URLS.BASE_URL,
        icons: [APP_URLS.LOGO_URL],
      },
    });
  }
  return walletConnectConnector;
};

export const config = createConfig({
  chains: [base], // Base Mainnet
  // chains: [baseSepolia], // Base Sepolia - commented out
  transports: {
    [base.id]: http(CURRENT_NETWORK.rpcUrl), // Use RPC URL from constants
    // [baseSepolia.id]: http(NETWORK.SEPOLIA.rpcUrl), // Base Sepolia RPC - commented out
  },
  connectors: [
    // Farcaster Mini App connector as the primary option
    farcasterMiniApp(), // Base configuration - no parameters needed for this version
    // farcasterMiniApp({
    //   // Ensure proper configuration for Farcaster Mini App
    //   appName: "vhibes",
    //   appDescription: "The Future of Social on Farcaster",
    //   appIcon: "https://vhibes.vercel.app/vhibes-logo.png",
    // }),
    injected({
      target: "metaMask",
    }),
    metaMask(),
    coinbaseWallet({
      appName: "vhibes",
    }),
    getWalletConnectConnector(),
  ],
  ssr: false, // Disable SSR to avoid indexedDB issues
  multiInjectedProviderDiscovery: true,
});

