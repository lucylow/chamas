## Chamas Contracts – 2 Hour Deployment Runbook

> Use this checklist to get the Chamas smart contracts live on Sepolia, plug the dapp into real ABIs, and record an on-chain demo.

### 1. Environment Setup (≈20 min)

1. **Install dependencies**
   ```bash
   cd contracts
   npm install
   ```
2. **Create environment file**
   ```bash
   cp env.local.sample ../frontend/.env.local
   cp env.local.sample .env.local # optional reference
   ```
   Fill in:
   - `SEPOLIA_RPC_URL` – Infura/Alchemy HTTPS endpoint
   - `PRIVATE_KEY` – Deployer wallet (testnet only)
   - `ETHERSCAN_API_KEY` – Optional for verification
   - `VITE_CHAMA_FACTORY_ADDRESS`, `VITE_USDC_ADDRESS`, `VITE_SEPOLIA_RPC_URL`, `VITE_WALLETCONNECT_PROJECT_ID`

3. **Quick smoke**
   ```bash
   npx hardhat accounts
   ```

### 2. Compile & Test (≈15 min)

```bash
npx hardhat compile
npx hardhat test
```

Expected: 8+ tests passing (`ChamaFactory` integration, rotation, payout, limits, etc.).

### 3. Deploy to Sepolia (≈15 min)

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Artifacts:
- `deployment.json` – persists factory, implementation, token addresses
- Console output includes all addresses ready for the frontend

### 4. (Optional) Verify Contracts

```bash
npx hardhat verify --network sepolia <FACTORY_ADDRESS> <CHAMA_IMPLEMENTATION> <CHAMA_TOKEN>
```

### 5. Populate Demo Data (≈10 min)

```bash
npx hardhat run scripts/demo-populate.js --network sepolia
```

Creates three chamas, joins members, seeds contributions.

### 6. Frontend Integration (≈20 min)

1. **Update `.env.local` in `frontend/`** with factory + token addresses.
2. **Start the app**
   ```bash
   cd ../frontend
  npm install
   npm run dev
   ```
3. **Connect wallet**
   - Use RainbowKit connect button (MetaMask)
   - Ensure Sepolia network (chain id `11155111`)
4. **On-chain actions**
   - Join chama → MetaMask tx
   - Approve USDC → Contribute
   - Confirm transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

### 7. Demo Checklist

- [ ] Contracts compiled & tested locally
- [ ] Deployment addresses saved + verified
- [ ] Frontend env updated with live addresses
- [ ] Join + contribute flows signing in MetaMask
- [ ] Demo script recorded (screen + Etherscan)
- [ ] README updated with contract links

### Useful Scripts

| Script | Purpose |
| --- | --- |
| `scripts/deploy.js` | Deploy implementation, token, factory |
| `scripts/interact.js` | Quick contract smoke (create chama) |
| `scripts/demo-populate.js` | Seed showcase chamas & contributions |

Happy shipping! 🚀

