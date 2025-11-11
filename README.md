# Chamas - Community Savings Powered by Ethereum

![Chamas Banner](https://via.placeholder.com/1200x400/22c55e/ffffff?text=Chamas+-+Akiba+ya+Jamii)

## 🌍 Overview

**Chamas** is an Ethereum-powered community savings platform designed for West Africa, featuring a Swahili AI assistant for financial inclusion. Built for the **ETH Safari Hackathon 2025** - AI & Swahili LLM Challenge ($10,000 track).

### What is a Chama?

A **chama** (Swahili for "group") is a traditional community-based savings and investment group popular in Kenya and East Africa. Members pool their resources together, contribute regularly, and receive payouts in rotation. Chamas brings this time-tested model to the blockchain for transparency, security, and global accessibility.

## ✨ Features

### 🔗 Ethereum Blockchain Integration
- **MetaMask Wallet Connection** - Secure wallet integration
- **Smart Contract Powered** - Transparent, immutable transactions
- **Sepolia Testnet** - Safe testing environment
- **On-chain Transparency** - All contributions and payouts recorded

### 🤖 Swahili AI Assistant
- **Bilingual Support** - Swahili (Kiswahili) and English
- **Voice Input** - Speak in Swahili using Web Speech API
- **Text-to-Speech** - Hear responses in Swahili
- **Financial Guidance** - AI-powered help for chama management
- **Cultural Context** - Understanding of East African financial practices

### 💰 Chama Management
- **Create Savings Groups** - Set contribution amounts and frequency
- **Join Existing Chamas** - Browse and join active groups
- **Automated Contributions** - Smart contract-based payments
- **Transparent Payouts** - Fair rotation system
- **Member Dashboard** - Track your savings and payouts

### 📱 Mobile-First Design
- **Responsive UI** - Works on all devices
- **Touch-Friendly** - Optimized for mobile browsers
- **Low-Bandwidth** - Efficient data usage
- **Progressive Web App** - Install on home screen

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (optional but recommended for local parity)
- MetaMask browser extension
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Frontend (React + Vite)
cd frontend
npm install
npm run dev  # http://localhost:5173

# Backend (FastAPI voice pipeline)
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Smart contracts (Hardhat)
cd ../contracts
npm install
npm test

# Optional: run everything with Docker
cd ..
docker-compose up --build
```

### Environment Variables

Backend (`backend/.env` or exported before running `uvicorn`):

- `REDIS_URL` – optional Redis instance for session memory (`redis://localhost:6379/0`)
- `SEPOLIA_RPC_URL` – Infura/Alchemy endpoint for Sepolia
- `CHAMA_FACTORY_ADDRESS` – deployed ChamaFactory contract
- `ENCRYPTION_KEY` – 32-byte base64 Fernet key for session tokens
- `OPENAI_API_KEY` / `OPENAI_BASE_URL` – optional OpenAI-compatible LLM endpoint
- `GOOGLE_APPLICATION_CREDENTIALS` – path to Google Cloud TTS service account

Frontend (`frontend/.env.local`):

- `VITE_APP_NAME` – display name (defaults to Chamas)
- `VITE_API_URL` – base URL for the FastAPI backend (e.g. `http://localhost:8000`)

## 🎯 How to Use

### 1. Connect Your Wallet
- Click "Connect Wallet" button
- Approve MetaMask connection
- Switch to Sepolia testnet if needed

### 2. Explore Chamas
- Browse available savings groups
- Filter by frequency (weekly/monthly)
- View details: members, contributions, payouts

### 3. Join a Chama
- Select a chama with available slots
- Click "Join" button
- Confirm transaction in MetaMask
- Start contributing!

### 4. Use AI Assistant
- Click the chat bubble in bottom-right
- Ask questions in Swahili or English
- Use voice input (click microphone icon)
- Get help with chama creation, contributions, etc.

### Example Swahili Commands

```
"Habari!" - Greet the assistant
"Unda chama" - Create a new chama
"Jiunge na chama" - Join a chama
"Chama ni nini?" - Learn about chamas
"Msaada" - Get help
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Blockchain**: ethers.js + wagmi + viem
- **AI**: FastAPI (Whisper ASR + LLaMA 3.1/Gemini + Google/Coqui TTS)
- **Routing**: wouter (lightweight React router)
- **State**: React Query

### Project Structure

```
chamas/
├── backend/                 # FastAPI voice pipeline + Swahili AI services
│   ├── main.py              # /voice/process endpoint
│   ├── services/            # ASR, LLM, TTS, Redis memory
│   ├── blockchain/          # Sepolia contract client helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # React + Vite Lovable client
│   ├── src/                 # Components, pages, lib utilities
│   ├── public/
│   └── Dockerfile
├── docs/                    # Architecture & playbooks
├── docker-compose.yml       # Local dev topology
└── package.json             # Root scripts (optional)
```

For the full NCED architecture breakdown see `docs/NCED_IMPLEMENTATION_GUIDE.md`.

## 🌐 Swahili Language Support

### Key Terms

| English | Swahili | Usage |
|---------|---------|-------|
| Chama | Chama | Savings group |
| Contribution | Mchango | Regular payment |
| Payout | Malipo | Distribution |
| Members | Wanachama | Group participants |
| Savings | Akiba | Accumulated funds |
| Join | Jiunge | Become a member |
| Create | Unda | Start new chama |
| Weekly | Kila Wiki | Frequency |
| Monthly | Kila Mwezi | Frequency |

### AI Capabilities

- **Dialect Support**: Kenyan Swahili (sw-KE)
- **Code-Switching**: Mixed Swahili-English
- **Financial Vocabulary**: Chama-specific terms
- **Voice Recognition**: Whisper ASR backend with browser fallback
- **Text-to-Speech**: Google Cloud / Coqui Swahili voices

## 🔐 Security

- **Non-Custodial**: You control your keys
- **Smart Contracts**: Auditable on-chain logic
- **MetaMask Integration**: Industry-standard wallet
- **Testnet First**: Safe testing environment
- **No Private Keys**: Never stored or transmitted

## 🎨 Design Philosophy

- **Mobile-First**: Optimized for African mobile users
- **Low-Bandwidth**: Efficient for slower connections
- **Culturally Relevant**: Swahili language and chama concepts
- **Accessible**: Voice input for literacy barriers
- **Transparent**: All transactions on blockchain

## 🏆 ETH Safari Hackathon

### AI & Swahili LLM Challenge

This project addresses the $10,000 AI & Swahili LLM Challenge by:

1. **Swahili Language Model**: AI assistant with Swahili understanding
2. **Voice AI**: Speech recognition and text-to-speech in Swahili
3. **Financial Inclusion**: Making Web3 accessible to Swahili speakers
4. **Cultural Context**: Understanding chama traditions
5. **Real-World Impact**: Solving actual savings challenges

### Judging Criteria

- ✅ **Accuracy & Robustness**: Swahili understanding with financial context
- ✅ **Real-Time Responsiveness**: Fast AI responses, voice input
- ✅ **Innovation**: Blockchain + AI for community savings
- ✅ **Ethical Data Handling**: No personal data stored, privacy-first
- ✅ **Practicality & Impact**: Solving real financial inclusion challenges

## 🚧 Roadmap

### Phase 1: MVP (Current)
- [x] MetaMask integration
- [x] Swahili AI chatbot
- [x] Voice input/output
- [x] Mock chama data
- [x] Mobile-responsive UI

### Phase 2: Smart Contracts
- [ ] Deploy Chama smart contracts
- [ ] Real on-chain contributions
- [ ] Automated payout distribution
- [ ] Multi-signature wallets

### Phase 3: Advanced Features
- [ ] M-Pesa integration
- [ ] Offline mode (PWA)
- [ ] Multi-dialect Swahili support
- [ ] Governance voting
- [ ] Chama analytics

### Phase 4: Scale
- [ ] Mainnet deployment
- [ ] Cross-chain support
- [ ] Mobile native apps
- [ ] Community partnerships

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **ETH Safari Hackathon** - For the opportunity
- **Ethereum Foundation** - For blockchain infrastructure
- **OpenAI** - For LLM capabilities
- **Kenyan Chama Communities** - For inspiration
- **Swahili Language Community** - For cultural guidance

## 📞 Contact

- **Project**: Chamas
- **Hackathon**: ETH Safari 2025
- **Track**: AI & Swahili LLM Challenge ($10k)
- **Built with**: ❤️ for financial inclusion in Africa

---

**Akiba ya Jamii, Mustakabali wa Jamii** 
*Community Savings, Community Future*

🌍 Making Web3 accessible to 200M+ Swahili speakers worldwide

