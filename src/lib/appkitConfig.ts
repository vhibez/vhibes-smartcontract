// src/lib/appkitConfig.ts
import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
// import { baseSepolia } from '@reown/appkit/networks' // Base Sepolia - commented out
import { base } from '@reown/appkit/networks' // Base Mainnet
import { config as wagmiConfig } from './wagmiConfig'

// Get projectId from your existing env variable
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [base] // Base Mainnet
// export const networks = [baseSepolia] // Base Sepolia - commented out

// Set up the Wagmi Adapter using the wagmi config that has all connectors
// This ensures AppKit can access all browser wallets (injected, MetaMask, Coinbase, etc.)
export const wagmiAdapter = new WagmiAdapter({
  wagmiConfig: wagmiConfig, // Use the config from wagmiConfig.ts that has all connectors
  projectId,
  networks
})

