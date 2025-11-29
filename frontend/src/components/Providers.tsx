"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiAdapter } from "../lib/appkitConfig";
import { MiniKitContextProvider } from "@/providers/MiniKitProvider";
import { type Config } from "wagmi";
import AutoConnect from "@/components/AutoConnect";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use wagmiAdapter.wagmiConfig which now includes all connectors from wagmiConfig.ts
  // This ensures AppKit and the app use the same config with all browser wallets
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
        <MiniKitContextProvider>
          <AutoConnect />
          {children}
        </MiniKitContextProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
