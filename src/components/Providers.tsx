"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "../lib/wagmiConfig";
import { MiniKitContextProvider } from '@/providers/MiniKitProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <MiniKitContextProvider>{children}</MiniKitContextProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

