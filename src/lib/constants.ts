/**
 * vhibes Network Constants
 * 
 * Centralized configuration for all network-related constants.
 * Update contract addresses, RPC URLs, and block explorer URLs here
 * when switching between networks (testnet/mainnet) or deploying new contracts.
 */

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

export const NETWORK = {
  // Current network: 'mainnet' or 'sepolia'
  CURRENT: 'mainnet' as 'mainnet' | 'sepolia',
  
  // Base Mainnet Configuration
  MAINNET: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorerUrl: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  
  // Base Sepolia Testnet Configuration
  SEPOLIA: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: 'https://sepolia.base.org',
    blockExplorerUrl: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

// Get current network config
export const CURRENT_NETWORK = NETWORK[NETWORK.CURRENT.toUpperCase() as 'MAINNET' | 'SEPOLIA'];

// ============================================================================
// CONTRACT ADDRESSES
// ============================================================================

export const CONTRACT_ADDRESSES = {
  // Base Mainnet Addresses
  MAINNET: {
    VHIBES_ADMIN: '0x4548f1c691b254DB4532C05D2118f66D2A78ec1C',
    VHIBES_POINTS: '0x738be79661d225048F8C0881adBC47bAA9211b7b',
    VHIBES_BADGES: '0xc0F8e7dA9d49A635f18d988f7a7C727eB0dA2C44',
    ROAST_ME: '0x96A472f40fcab11CB17045c04122Dd6e311F8324',
    ICEBREAKER: '0x72b92D55195c05E43A7E752839d6eCD23104ca8a',
    CHAIN_REACTION: '0xE09596824F17c41eD18cCe7d7035908526f2BF14',
  },
  
  // Base Sepolia Testnet Addresses (if needed in future)
  SEPOLIA: {
    VHIBES_ADMIN: '0x0000000000000000000000000000000000000000', // Placeholder
    VHIBES_POINTS: '0x0000000000000000000000000000000000000000', // Placeholder
    VHIBES_BADGES: '0x0000000000000000000000000000000000000000', // Placeholder
    ROAST_ME: '0x0000000000000000000000000000000000000000', // Placeholder
    ICEBREAKER: '0x0000000000000000000000000000000000000000', // Placeholder
    CHAIN_REACTION: '0x0000000000000000000000000000000000000000', // Placeholder
  },
} as const;

// Current network contract addresses (automatically selected based on NETWORK.CURRENT)
export const CONTRACTS = CONTRACT_ADDRESSES[NETWORK.CURRENT.toUpperCase() as 'MAINNET' | 'SEPOLIA'];

// Individual contract exports for convenience
export const VHIBES_ADMIN_ADDRESS = CONTRACTS.VHIBES_ADMIN;
export const VHIBES_POINTS_ADDRESS = CONTRACTS.VHIBES_POINTS;
export const VHIBES_BADGES_ADDRESS = CONTRACTS.VHIBES_BADGES;
export const ROAST_ME_CONTRACT_ADDRESS = CONTRACTS.ROAST_ME;
export const ICEBREAKER_CONTRACT_ADDRESS = CONTRACTS.ICEBREAKER;
export const CHAIN_REACTION_CONTRACT_ADDRESS = CONTRACTS.CHAIN_REACTION;

// ============================================================================
// APPLICATION URLS
// ============================================================================

export const APP_URLS = {
  BASE_URL: 'https://vhibes.vercel.app',
  LOGO_URL: 'https://vhibes.vercel.app/vhibes-logo.png',
  OG_IMAGE_URL: 'https://vhibes.vercel.app/og.png',
  FARCASTER_URL: 'https://warpcast.com/vhibes',
  WARPCAST_COMPOSE: 'https://warpcast.com/~/compose',
} as const;

// ============================================================================
// NETWORK HELPERS
// ============================================================================

/**
 * Get contract address for a specific contract
 * @param contractName - Name of the contract
 * @param network - Optional network override ('mainnet' | 'sepolia')
 * @returns Contract address as `0x${string}`
 */
export function getContractAddress(
  contractName: keyof typeof CONTRACT_ADDRESSES.MAINNET,
  network?: 'mainnet' | 'sepolia'
): `0x${string}` {
  const targetNetwork = network || NETWORK.CURRENT;
  return CONTRACT_ADDRESSES[targetNetwork.toUpperCase() as 'MAINNET' | 'SEPOLIA'][contractName] as `0x${string}`;
}

/**
 * Get block explorer URL for transactions or addresses
 * @param type - 'tx' for transaction, 'address' for contract/address
 * @param hash - Transaction hash or address
 * @returns Full block explorer URL
 */
export function getBlockExplorerUrl(type: 'tx' | 'address', hash: string): string {
  const baseUrl = CURRENT_NETWORK.blockExplorerUrl;
  return `${baseUrl}/${type}/${hash}`;
}

