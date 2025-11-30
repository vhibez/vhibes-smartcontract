# vhibes Frontend 🚀

Frontend for the vhibes Farcaster mini-app, built with Next.js and deployed on Vercel.

## 📋 Overview

This repository contains the frontend application for the vhibes platform:

- **🔥 AI Roast Me**: Submit selfies for hilarious AI-generated roasts
- **🧊 Icebreaker Mode**: Answer quirky prompts and create polls
- **⚡ Chain Reaction**: Start viral challenges and join the fun
- **🏆 Points & Badges**: Earn points and collect achievement badges
- **📱 Farcaster Integration**: Seamless wallet connection and sharing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or any Web3 wallet
- Base Sepolia testnet ETH

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vhibez/vhibes-frontend.git
   cd vhibes-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your configuration:
   ```env
   NEXT_PUBLIC_VHIBES_ADMIN_ADDRESS=your_admin_contract_address
   NEXT_PUBLIC_VHIBES_POINTS_ADDRESS=your_points_contract_address
   NEXT_PUBLIC_VHIBES_BADGES_ADDRESS=your_badges_contract_address
   NEXT_PUBLIC_ROAST_ME_ADDRESS=your_roast_me_contract_address
   NEXT_PUBLIC_ICEBREAKER_ADDRESS=your_icebreaker_contract_address
   NEXT_PUBLIC_CHAIN_REACTION_ADDRESS=your_chain_reaction_contract_address
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   NEXT_PUBLIC_CDP_CLIENT_API_KEY=your_coinbase_api_key
   NEXT_PUBLIC_HUGGING_FACE_API_KEY=your_huggingface_api_key
   NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
vhibes-frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utility functions and configs
│   ├── providers/        # React providers
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Dependencies
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Web3**: Wagmi + Viem
- **Wallet Integration**: Farcaster Mini App Connector + Base MiniKit
- **State Management**: React hooks + TanStack Query
- **AI Integration**: Hugging Face Inference API
- **Storage**: IPFS via Pinata

## 🎨 Design System

### Color Palette

vhibes uses a nature-inspired color scheme that creates a calming and modern aesthetic:

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Dark Olive Green** | `#324028` | Primary dark background |
| **Olive Green** | `#7A712E` | Secondary accent |
| **Light Olive/Khaki** | `#CCC675` | Accent color |
| **Teal Blue** | `#3CA2A6` | Primary brand color |
| **Light Blue/Mint Green** | `#A2E2CD` | Light accent/hover states |
| **Very Light Mint Green** | `#D4FAD1` | Background light variant |

### Color Usage

- **Primary Background**: Dark olive green (`#324028`) to Teal blue (`#3CA2A6`) gradient
- **Primary Actions**: Teal blue (`#3CA2A6`) for buttons and interactive elements
- **Hover States**: Light blue/mint green (`#A2E2CD`)
- **Accents**: Olive green (`#7A712E`) and light olive/khaki (`#CCC675`) for highlights
- **Light Backgrounds**: Very light mint green (`#D4FAD1`) for cards and overlays

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_VHIBES_ADMIN_ADDRESS` | Admin contract address | ✅ |
| `NEXT_PUBLIC_VHIBES_POINTS_ADDRESS` | Points contract address | ✅ |
| `NEXT_PUBLIC_VHIBES_BADGES_ADDRESS` | Badges contract address | ✅ |
| `NEXT_PUBLIC_ROAST_ME_ADDRESS` | RoastMe contract address | ✅ |
| `NEXT_PUBLIC_ICEBREAKER_ADDRESS` | Icebreaker contract address | ✅ |
| `NEXT_PUBLIC_CHAIN_REACTION_ADDRESS` | ChainReaction contract address | ✅ |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | ✅ |
| `NEXT_PUBLIC_CDP_CLIENT_API_KEY` | Coinbase API key | ✅ |
| `NEXT_PUBLIC_HUGGING_FACE_API_KEY` | Hugging Face API key | ✅ |
| `NEXT_PUBLIC_PINATA_JWT` | Pinata JWT for IPFS | ✅ |

## 🧪 Development

Run the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

Run linting:
```bash
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** with automatic builds on push

### Manual Deployment

```bash
npm run build
npm start
```

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Live App**: [https://vhibes.vercel.app](https://vhibes.vercel.app)
- **Farcaster Mini App**: [https://farcaster.xyz/miniapps/vhibes](https://farcaster.xyz/miniapps/vhibes)
- **Smart Contracts**: [https://github.com/vhibez/vhibes-smartcontract](https://github.com/vhibez/vhibes-smartcontract)
- **GitHub**: [https://github.com/vhibez/vhibes-frontend](https://github.com/vhibez/vhibes-frontend)

---

**Made with ❤️ by the vhibes team**
