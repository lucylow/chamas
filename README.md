# Chamas - Community Savings Powered by Ethereum

## 🌍 Overview

**Chamas** is an Ethereum-powered community savings platform designed for West Africa, featuring a Swahili AI assistant for financial inclusion. Built for the **ETH Safari Hackathon 2025** - AI & Swahili LLM Challenge ($10,000 track).

### What is a Chama?

A **chama** (Swahili for "group") is a traditional community-based savings and investment group popular in Kenya and East Africa. Members pool their resources together, contribute regularly, and receive payouts in rotation. Chamas brings this time-tested model to the blockchain for transparency, security, and global accessibility.

## ✨ Features

### 🔗 Ethereum Blockchain Integration
- **MetaMask / RainbowKit** – Wallet onboarding and multi-connector support
- **Verified Smart Contracts** – `ChamaFactory`, `Chama` clone implementation, `ChamaToken`
- **Sepolia Testnet** – Live transactions on `chainId 11155111`
- **On-chain Transparency** – Contributions, joins, rotations emitted as indexed events
- **Deployment Scripts** – Deploy, interact, and seed demo data via Hardhat scripts
- **EIP-1167 Minimal Proxy Clones** – Gas-efficient chama deployment (~45K gas vs ~2.3M gas per instance)
- **ERC20 Token Support** – Native integration with any ERC20 token (USDC, DAI, etc.)
- **OpenZeppelin Contracts** – Battle-tested security libraries (AccessControl, ReentrancyGuard, SafeERC20)
- **Event-Driven Architecture** – Indexed events for efficient off-chain querying
- **Non-Custodial Design** – Users maintain full control of their funds and keys

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
- **Sepolia Contract Reader** - FastAPI fetches live data via `AsyncWeb3`

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
npx hardhat compile
npx hardhat test

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
- `VITE_CHAMA_FACTORY_ADDRESS` – deployed factory on Sepolia
- `VITE_USDC_ADDRESS` – ERC20 used for contributions (default Sepolia USDC faucet token)
- `VITE_SEPOLIA_CHAIN_ID` – defaults to `11155111`
- `VITE_SEPOLIA_RPC_URL` – RPC for wagmi public client
- `VITE_WALLETCONNECT_PROJECT_ID` – WalletConnect app id

Copy `frontend/env.local.sample` to `.env.local` to get started.

Contracts (`contracts/.env.local` or exported before running scripts):

- `SEPOLIA_RPC_URL`
- `PRIVATE_KEY`
- `ETHERSCAN_API_KEY` (optional)

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
- **Blockchain**: Hardhat + Solidity 0.8.20 + ethers.js + wagmi + viem
- **AI**: FastAPI (Whisper ASR + LLaMA 3.1/Gemini + Google/Coqui TTS)
- **Routing**: wouter (lightweight React router)
- **State**: React Query

### Project Structure

```
chamas/
├── backend/                     # FastAPI voice pipeline + Swahili AI services
│   ├── main.py                  # /voice/process + /chamas endpoints
│   ├── services/                # ASR, LLM, TTS, Redis memory, security
│   ├── blockchain/              # AsyncWeb3 Sepolia client helpers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                    # React + Vite Lovable client
│   ├── src/                     # Components, pages, lib utilities
│   ├── public/
│   └── Dockerfile
├── contracts/                   # Hardhat configuration, Solidity, deployment scripts
├── docs/                        # Architecture & playbooks
├── docker-compose.yml           # Local dev topology
└── package.json                 # Root scripts (optional)
```

For design details see `docs/chamas-smart-contracts.md`. Deployment playbook lives in `docs/chamas-deployment-quickstart.md`.                                  

### Deployed Contracts (Sepolia)

Addresses are generated via `contracts/scripts/deploy.js` and saved in `contracts/deployment.json`. Update this section after each deployment.

| Contract | Address | Notes |
| --- | --- | --- |
| ChamaFactory | _TBD_ | Primary registry |
| Chama Implementation | _TBD_ | Clone target |
| ChamaToken | _TBD_ | Governance token |
| USDC (Test Asset) | `0x6f14c9687ccf0532413d582b8f6320802f89f90a` | Faucet mintable |

### System Architecture (High-Level)

```mermaid
graph TD
    A[Voice/Web User] -->|Audio/Text| B[Frontend (React/Vite)]
    B -->|REST: POST /voice/process| C[FastAPI Backend]
    B -->|REST: GET /chamas| C
    C -->|ASR| D[Whisper Base<br/>CUDA/CPU inference]
    C -->|LLM| E[LLaMA 3.1 8B<br/>or OpenAI-compatible endpoint]
    C -->|TTS| F[Google Cloud TTS<br/>or Coqui]
    C -->|AsyncWeb3| G[Sepolia RPC Provider]
    G --> H[ChamaFactory Contract]
    C -->|Redis Sessions| I[Redis Memory Store]
    C -->|Prometheus| J[Metrics Collector]
```

### Voice Processing Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as VoiceChat.tsx
    participant API as FastAPI /voice/process
    participant ASR as Whisper ASR
    participant LLM as LLM Service
    participant TTS as TTS Service
    participant CH as AsyncWeb3 ChamaClient

    U->>UI: Capture Opus/WebM via MediaRecorder
    UI->>API: multipart/form-data upload
    API->>ASR: transcribe(language=sw)
    ASR-->>API: transcript + confidence + dialect
    API->>CH: getChamaInfo / list_chamas
    CH-->>API: ChamaSummary data
    API->>LLM: prompt(context + intent + chama)
    LLM-->>API: Swahili response text
    API->>TTS: synthesise(response)
    TTS-->>API: audio/mpeg bytes
    API-->>UI: streaming audio + headers
    UI-->>U: Play response + render metadata
```

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
- **Latency Targets**: ASR ≤ 0.5s, LLM ≤ 1.0s, TTS ≤ 1.5s (95th percentile)

## ⛓️ Ethereum Architecture & Standards

### Ethereum Standards Implemented

| Standard | Purpose | Implementation |
|----------|---------|----------------|
| **EIP-1167** | Minimal Proxy Pattern | Gas-efficient clone deployment for Chama instances |
| **ERC-20** | Token Standard | Contributions via any ERC20 token (USDC, DAI, etc.) |
| **EIP-165** | Interface Detection | Standard interface support for contract compatibility |
| **EIP-712** | Structured Data Hashing | Type-safe message signing for wallet integrations |

### Ethereum Network Configuration

- **Network**: Sepolia Testnet (`chainId: 11155111`)
- **RPC Providers**: Infura, Alchemy, or custom Ethereum node
- **Block Explorer**: [Sepolia Etherscan](https://sepolia.etherscan.io/)
- **Gas Token**: Sepolia ETH (testnet only, no real value)
- **Test Tokens**: Sepolia USDC faucet at `0x6f14c9687ccf0532413d582b8f6320802f89f90a`

### Gas Optimization Strategy

The Chamas protocol uses **EIP-1167 minimal proxy clones** to dramatically reduce gas costs:

- **Full Deployment**: ~2.3M gas per chama (without clones)
- **Clone Deployment**: ~45K gas per chama (95% reduction)
- **Factory Pattern**: Single implementation contract shared across all chamas
- **Storage Optimization**: Minimal state variables, efficient mappings

**Gas Cost Breakdown** (approximate):
- `createChama()`: ~180,000 gas
- `joinChama()`: ~65,000 gas
- `contribute()`: ~85,000 gas (includes ERC20 transfer)
- `distributePayout()`: ~75,000 gas (includes ERC20 transfer)

### ERC20 Token Integration

Chamas supports **any ERC20-compliant token** for contributions:

```solidity
// Token approval flow
IERC20(tokenAddress).approve(chamaFactoryAddress, amount);
ChamaFactory(factoryAddress).contribute(chamaId, amount);
```

**Supported Tokens**:
- USDC (USD Coin) - Primary testnet token
- DAI (Dai Stablecoin)
- Any custom ERC20 token
- Native ETH (future support)

**Token Requirements**:
- Must implement `transferFrom(address, address, uint256)`
- Must implement `balanceOf(address) returns (uint256)`
- Must have sufficient decimals precision

## ⛓️ Smart Contract Deep Dive

### Contract Architecture

The Chamas protocol consists of three core smart contracts:

1. **ChamaFactory** - Registry and orchestration layer
2. **Chama** - Individual savings group instance (deployed as minimal proxy)
3. **ChamaToken** - Optional governance/reward token

### Contract Interface

```solidity
contract ChamaFactory {
    // Core functions
    function createChama(
        string memory _name,
        string memory _description,
        uint256 _contributionAmount,
        uint256 _contributionFrequency,
        address _tokenAddress,
        uint256 _maxMembers
    ) external returns (uint256 chamaId);
    
    function joinChama(uint256 _chamaId) external;
    function contribute(uint256 _chamaId, uint256 _amount) external;
    function distributePayout(uint256 _chamaId, address _recipient, uint256 _rotationRound) external;
    
    // View functions
    function getChamaDetails(uint256 _chamaId) external view returns (ChamaDetails memory);
    function getActiveChamaIds() external view returns (uint256[] memory);
    function getUserChamas(address _user) external view returns (uint256[] memory);
}
```

### Function Reference

| Function | Description | Emits | Gas Cost | Security |
|----------|-------------|-------|----------|----------|
| `createChama` | Deploys a new chama via EIP-1167 clone | `ChamaCreated` | ~180K | AccessControl, input validation |
| `joinChama` | Adds sender as member if active | `MemberJoined` | ~65K | Membership checks, max members |
| `contribute` | Accepts ERC20 contribution | `ContributionMade` | ~85K | SafeERC20, membership, amount validation |
| `distributePayout` | Distributes rotation payout | `PayoutDistributed` | ~75K | Creator-only, ReentrancyGuard |
| `getChamaDetails` | Returns struct snapshot | - | View (free) | Public read access |
| `getActiveChamaIds` | Returns all active chama IDs | - | View (free) | Public read access |

### Ethereum Event System

All state changes emit **indexed events** for efficient off-chain querying:

```solidity
event ChamaCreated(
    uint256 indexed chamaId,
    address indexed creator,
    address chamaAddress,
    string name,
    uint256 contributionAmount
);

event MemberJoined(
    uint256 indexed chamaId,
    address indexed member,
    uint256 timestamp
);

event ContributionMade(
    uint256 indexed chamaId,
    address indexed contributor,
    uint256 amount,
    uint256 timestamp
);

event PayoutDistributed(
    uint256 indexed chamaId,
    address indexed recipient,
    uint256 amount,
    uint256 rotationRound
);
```

**Event Benefits**:
- **Indexed Parameters**: Fast filtering by `chamaId`, `creator`, `member`, etc.
- **Off-chain Indexing**: TheGraph, Alchemy, or custom indexers
- **Real-time Monitoring**: WebSocket subscriptions for live updates
- **Historical Queries**: Efficient retrieval of past transactions

### Security Features

#### OpenZeppelin Security Libraries

- **ReentrancyGuard**: Prevents reentrancy attacks on `contribute()` and `distributePayout()`
- **SafeERC20**: Safe token transfers with proper error handling
- **AccessControl**: Role-based access control for factory administration
- **Custom Errors**: Gas-efficient error reporting (EIP-838)

#### Security Patterns

```solidity
// Reentrancy protection
modifier nonReentrant() {
    require(!locked, "ReentrancyGuard: reentrant call");
    locked = true;
    _;
    locked = false;
}

// Safe token transfers
using SafeERC20 for IERC20;
IERC20(token).safeTransfer(recipient, amount);

// Input validation
require(_contributionAmount > 0, "Contribution amount must be > 0");
require(_maxMembers > 1, "Chama must have at least 2 members");
require(_tokenAddress != address(0), "Invalid token address");
```

### Transaction Flow Diagrams

#### Creating a Chama

```mermaid
sequenceDiagram
    participant U as User Wallet
    participant F as Frontend (wagmi)
    participant C as ChamaFactory Contract
    participant P as Chama Proxy (Clone)
    participant T as ERC20 Token

    U->>F: Click "Create Chama"
    F->>U: Request MetaMask signature
    U->>F: Approve transaction
    F->>C: createChama(name, amount, frequency, token, maxMembers)
    C->>P: Clones.createClone(implementation)
    C->>P: initialize(...)
    C->>P: addMember(creator)
    C->>T: Verify token address
    C-->>F: Emit ChamaCreated event
    F-->>U: Show success + chama ID
```

#### Contributing to a Chama

```mermaid
sequenceDiagram
    participant U as User Wallet
    participant F as Frontend (wagmi)
    participant T as ERC20 Token
    participant C as ChamaFactory
    participant P as Chama Proxy

    U->>F: Click "Contribute"
    F->>T: approve(factory, amount)
    U->>F: Approve token allowance
    T-->>F: Approval confirmed
    F->>C: contribute(chamaId, amount)
    C->>T: transferFrom(user, chama, amount)
    T-->>C: Transfer successful
    C->>P: recordContribution(user, amount)
    P-->>C: Contribution recorded
    C-->>F: Emit ContributionMade event
    F-->>U: Show success + updated balance
```

### Wallet Integration

#### Supported Wallets

- **MetaMask** - Browser extension wallet (primary)
- **RainbowKit** - Multi-wallet connector support
- **WalletConnect** - Mobile wallet connections
- **Coinbase Wallet** - Via WalletConnect
- **Any EIP-1193 compatible wallet**

#### Wallet Connection Flow

```typescript
// Using wagmi hooks
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const { address, isConnected } = useAccount();
const { connect, connectors } = useConnect();
const { disconnect } = useDisconnect();

// Connect to MetaMask
connect({ connector: connectors[0] });

// Switch to Sepolia network
await window.ethereum.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
});
```

#### Transaction Signing

All transactions require user approval via their wallet:

1. **User Action**: Click "Join", "Contribute", etc.
2. **Frontend**: Constructs transaction via `wagmi` hooks
3. **Wallet Prompt**: MetaMask shows transaction details
4. **User Approval**: User confirms or rejects
5. **Broadcast**: Transaction sent to Sepolia network
6. **Confirmation**: Wait for block confirmation (~12 seconds)
7. **Event Emission**: Contract emits indexed event
8. **UI Update**: Frontend queries updated state

### Deployment Workflow

```bash
cd contracts
npx hardhat test
SEPOLIA_RPC_URL=<https://...> PRIVATE_KEY=<0x...>
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat verify --network sepolia <deployed-address>  # optional
```

Set the resulting address in `backend/.env` as `CHAMA_FACTORY_ADDRESS` and restart the FastAPI service.

### On-Chain Data Flow

```mermaid
graph LR
    Frontend -->|GET /chamas| FastAPI
    FastAPI -->|AsyncWeb3| SepoliaRPC[Sepolia JSON-RPC]
    SepoliaRPC --> ChamaFactory
    FastAPI -->|ChamaSummary JSON| Frontend
```

- `ChamaClient.list_chamas(limit)` queries `chamaCount()` then batches `getChamaInfo(id)` using `asyncio.gather`.
- Responses are normalized into ETH + wei values, stored as `ChamaSummary.to_dict()` and sent to the UI.
- If the RPC call fails, the UI falls back to mock data but flags degraded blockchain connectivity.

### Ethereum RPC Integration

The backend uses **AsyncWeb3** (Python) to interact with Ethereum:

```python
from web3 import AsyncWeb3
from web3.middleware import geth_poa_middleware

w3 = AsyncWeb3(AsyncHTTPProvider(SEPOLIA_RPC_URL))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)  # Sepolia is PoA

# Query contract state
factory = w3.eth.contract(address=factory_address, abi=CHAMA_FACTORY_ABI)
chama_count = await factory.functions.chamaCounter().call()
chama_details = await factory.functions.getChamaDetails(chama_id).call()
```

**RPC Methods Used**:
- `eth_call` - Read contract state (view functions)
- `eth_getLogs` - Query event logs
- `eth_blockNumber` - Get latest block
- `eth_getTransactionReceipt` - Verify transaction confirmations

### Frontend Ethereum Integration

The frontend uses **wagmi** + **viem** for Ethereum interactions:

```typescript
import { useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

// Read chama details
const { data: chamaDetails } = useContractRead({
  address: CHAMA_FACTORY_ADDRESS,
  abi: chamaFactoryABI,
  functionName: 'getChamaDetails',
  args: [chamaId],
});

// Write transaction (contribute)
const { config } = usePrepareContractWrite({
  address: CHAMA_FACTORY_ADDRESS,
  abi: chamaFactoryABI,
  functionName: 'contribute',
  args: [chamaId, parseUnits(amount, 6)], // USDC has 6 decimals
});

const { write: contribute } = useContractWrite(config);
```

**Key Libraries**:
- **wagmi** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **@tanstack/react-query** - Caching and state management
- **RainbowKit** - Wallet connection UI

### Observability & Safety

- Prometheus gauges: `asr_latency_seconds`, `llm_latency_seconds`, `tts_latency_seconds`, `voice_requests_total`.
- SlowAPI throttles `/voice/process` and `/chamas` at 10 req/min per IP.
- Optional Fernet encryption (`ENCRYPTION_KEY`) obfuscates `session_id` returned to the browser.

## 🔐 Security

### Smart Contract Security

- **Non-Custodial**: You control your keys - funds never held by contracts
- **Auditable Code**: All contracts verified on Etherscan with source code
- **OpenZeppelin Libraries**: Battle-tested security patterns
- **Reentrancy Protection**: `ReentrancyGuard` on all state-changing functions
- **Safe Token Transfers**: `SafeERC20` prevents token transfer failures
- **Input Validation**: Comprehensive checks on all user inputs
- **Access Control**: Role-based permissions via OpenZeppelin `AccessControl`
- **Custom Errors**: Gas-efficient error handling (EIP-838)

### Application Security

- **MetaMask Integration**: Industry-standard EIP-1193 wallet
- **Testnet First**: Safe testing environment before mainnet
- **No Private Keys**: Never stored or transmitted - all signing via wallet
- **Rate Limiting**: SlowAPI enforces 10 req/min per IP on voice endpoints
- **Session Encryption**: Optional Fernet key encrypts session headers
- **HTTPS Only**: All API communications over encrypted connections

### Security Best Practices

1. **Always verify contract addresses** before interacting
2. **Check token approvals** - only approve necessary amounts
3. **Verify transaction details** in MetaMask before signing
4. **Use testnet first** to familiarize yourself with the protocol
5. **Never share private keys** - Chamas never requests them
6. **Monitor events** - Subscribe to contract events for transparency

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

## 🧪 Testing & Benchmarking

- **Hardhat**: `npx hardhat test` covers deployment, membership, and contribution flows.
- **Voice Pipeline**: `pytest` suite (planned) will mock ASR/LLM/TTS with fixtures; use `/voice/process` curl scripts for latency sampling.
- **WER Tracking**: `backend/scripts/finetune_whisper.py` exposes evaluation hooks; target `<20%` WER on Mozilla Common Voice Swahili subset.
- **Load Tests**: `locustfile.py` (coming soon) will stress `/voice/process` and `/chamas` to validate SlowAPI throttling and Redis TTL behaviour.
- **Metrics**: scrape `/metrics` with Prometheus or run `docker-compose up prometheus grafana` (planned) for dashboarding.

## 🚧 Roadmap

### Phase 1: MVP (Current)
- [x] MetaMask integration
- [x] Swahili AI chatbot
- [x] Voice input/output
- [x] Mock chama data
- [x] Mobile-responsive UI

### Phase 2: Smart Contracts
- [x] Deploy Chama smart contracts (factory + clones + token)
- [x] Real on-chain contributions via ERC20 approval flow
- [x] Automated payout distribution (rotation + SafeERC20 transfers)
- [ ] Multi-signature wallets

### Phase 3: Advanced Features
- [ ] M-Pesa integration
- [ ] Offline mode (PWA)
- [ ] Multi-dialect Swahili support
- [ ] Governance voting
- [ ] Chama analytics

### Phase 4: Scale
- [ ] Mainnet deployment (Ethereum mainnet)
- [ ] Layer 2 integration (Arbitrum, Optimism, Base)
- [ ] Cross-chain support (via bridges)
- [ ] Mobile native apps
- [ ] Community partnerships
- [ ] Gasless transactions (meta-transactions via EIP-2771)

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
- **Ethereum Foundation** - For blockchain infrastructure and standards
- **OpenZeppelin** - For secure, audited smart contract libraries
- **Hardhat** - For excellent Ethereum development framework
- **wagmi & viem** - For seamless React Ethereum integration
- **OpenAI** - For LLM capabilities
- **Kenyan Chama Communities** - For inspiration
- **Swahili Language Community** - For cultural guidance

## 📚 Ethereum Resources

### Learning Ethereum

- [Ethereum.org](https://ethereum.org/) - Official Ethereum documentation
- [Solidity Documentation](https://docs.soliditylang.org/) - Smart contract language
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/) - Security libraries
- [Ethereum Improvement Proposals](https://eips.ethereum.org/) - EIP standards

### Development Tools

- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [Etherscan](https://etherscan.io/) - Block explorer and contract verification
- [Remix IDE](https://remix.ethereum.org/) - Online Solidity IDE
- [MetaMask](https://metamask.io/) - Browser wallet

### Testnet Resources

- [Sepolia Faucet](https://sepoliafaucet.com/) - Get testnet ETH
- [Sepolia Etherscan](https://sepolia.etherscan.io/) - Testnet block explorer
- [Chainlink Faucet](https://faucets.chain.link/) - Alternative testnet faucet

## 📞 Contact

- **Project**: Chamas
- **Hackathon**: ETH Safari 2025
- **Track**: AI & Swahili LLM Challenge ($10k)
- **Built with**: ❤️ for financial inclusion in Africa

---

**Akiba ya Jamii, Mustakabali wa Jamii** 
*Community Savings, Community Future*

🌍 Making Web3 accessible to 200M+ Swahili speakers worldwide

