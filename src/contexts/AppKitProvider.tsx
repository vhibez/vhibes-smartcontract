'use client'

import { wagmiAdapter, projectId } from '@/lib/appkitConfig'
import { createAppKit } from '@reown/appkit/react'
// import { baseSepolia } from '@reown/appkit/networks' // Base Sepolia - commented out
import { base } from '@reown/appkit/networks' // Base Mainnet
import React, { type ReactNode } from 'react'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata for vhibes
const metadata = {
  name: 'vhibes',
  description: 'The Future of Social on Farcaster - AI roasts, icebreakers, and viral challenges',
  url: 'https://vhibes.vercel.app',
  icons: ['https://vhibes.vercel.app/vhibes-logo.png']
}

// Create the AppKit modal
// AppKit will automatically detect injected wallets from the WagmiProvider's config
const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [base], // Base Mainnet
  // networks: [baseSepolia], // Base Sepolia - commented out
  defaultNetwork: base, // Base Mainnet
  // defaultNetwork: baseSepolia, // Base Sepolia - commented out
  metadata: metadata,
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#3CA2A6',
    '--w3m-accent-fill-color': '#ffffff',
    '--w3m-background-color': '#324028',
    '--w3m-container-border-radius': '8px',
  }
})

// AppKitProvider only initializes the AppKit modal
// WagmiProvider and QueryClientProvider are provided by Providers component
function AppKitProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  return <>{children}</>
}

export default AppKitProvider

