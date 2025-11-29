# vhibes Smart Contracts 🔐

Smart contracts for the vhibes Farcaster mini-app, deployed on Base network.

## 📋 Overview

This repository contains all the smart contracts powering the vhibes platform:

- **VhibesAdmin**: Platform administration and authorization
- **VhibesPoints**: Points system and user rewards
- **VhibesBadges**: NFT badges and achievements
- **RoastMeContract**: AI roast submissions and voting
- **IcebreakerContract**: Prompts, polls, and responses
- **ChainReactionContract**: Viral challenges and responses

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Base Sepolia testnet ETH for deployment

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   PRIVATE_KEY=your_private_key_here
   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
   BASESCAN_API_KEY=your_basescan_api_key_here
   ```

3. **Compile contracts**
   ```bash
   npm run compile
   ```

4. **Run tests**
   ```bash
   npm run test
   ```

5. **Deploy to Base Sepolia**
   ```bash
   npm run deploy:base-sepolia
   ```

## 🏗️ Project Structure

```
vhibes-smartcontract/
├── contracts/          # Solidity smart contracts
├── scripts/            # Deployment scripts
├── test/               # Test files
├── hardhat.config.ts   # Hardhat configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## 📝 Contracts

### VhibesAdmin
Manages platform administration and authorization.

### VhibesPoints
Handles the points system and user rewards.

### VhibesBadges
Manages NFT badges and achievements.

### RoastMeContract
Handles AI roast submissions and community voting.

### IcebreakerContract
Manages prompts, polls, and user responses.

### ChainReactionContract
Handles viral challenges and responses.

## 🔧 Configuration

### Networks

- **Base Sepolia** (Testnet): Chain ID 84532
- **Base** (Mainnet): Chain ID 8453

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PRIVATE_KEY` | Private key for deployment | ✅ |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC endpoint | ✅ |
| `BASE_RPC_URL` | Base mainnet RPC endpoint | ⚠️ |
| `BASESCAN_API_KEY` | Basescan API key for verification | ⚠️ |

## 🧪 Testing

Run all tests:
```bash
npm run test
```

Run specific test file:
```bash
npx hardhat test test/ContractName.ts
```

## 🚀 Deployment

### Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:base-sepolia
```

### Deploy to Base (Mainnet)

```bash
npx hardhat run scripts/deploy.ts --network base
```

### Verify Contracts

After deployment, verify on Basescan:

```bash
npx hardhat verify --network base-sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Base Explorer**: [https://basescan.org](https://basescan.org)
- **Base Sepolia Explorer**: [https://sepolia.basescan.org](https://sepolia.basescan.org)
- **Frontend**: [https://github.com/vhibez/vhibes-frontend](https://github.com/vhibez/vhibes-frontend)

---

**Made with ❤️ by the vhibes team**

