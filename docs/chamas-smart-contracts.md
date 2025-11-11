## Chamas Smart Contract Architecture

This document describes the Solidity components that now power the Chamas dApp.

### Overview

| Contract | Purpose | Key Features |
| --- | --- | --- |
| `ChamaFactory` | Registry + orchestration | Clone deployment (EIP-1167), member management, contributions, rotation payouts, governance token reference |
| `Chama` | Individual chama instance | Membership, contribution tracking, rotation logic, ERC20 payouts, pause/close |
| `ChamaToken` | Optional governance/reward token | Mintable by factory owner |
| `MockERC20` | Test helper token | Configurable decimals, faucet-style mint function |

### Deployment Flow

1. Deploy base `Chama` implementation.
2. Deploy `ChamaToken` (governance/XP).
3. Deploy `ChamaFactory` with implementation + token addresses.
4. `ChamaFactory.createChama` clones the implementation, initialises storage, and registers metadata.

### ChamaFactory Highlights

* **Clone pattern** – `Clones.clone` keeps gas costs low per chama.
* **Events** – `ChamaCreated`, `ChamaJoined`, `ContributionMade`, `RotationProcessed`, `ChamaClosed`, `ChamaImplementationUpdated`.
* **Safety** – `Ownable` upgrade control, `ReentrancyGuard`, custom errors.
* **APIs exposed to frontend**
  * `getActiveChamaIds()`
  * `getChamaDetails(uint256 id)`
  * `getChamaMembers(uint256 id)`
  * `joinChama(uint256 id)`
  * `contribute(uint256 id, uint256 amount)`
  * `processRotation(uint256 id)`

### Chama Instance

* Tracks members, contribution totals, next rotation timestamp, rotation recipients.
* `processRotation()` transfers pooled ERC20 funds to the next recipient.
* Guarded by factory-only modifiers to ensure all state transitions happen through `ChamaFactory`.

### Testing

`contracts/test/ChamaFactory.test.js` exercises:

1. Chama creation + metadata
2. Member joins and duplicate prevention
3. Max member enforcement
4. Contribution guard rails (allowance, membership)
5. Contribution accounting + balance checks
6. Rotation payouts + token transfers
7. Creator-driven close flow
8. Implementation upgrade permissions

### Hardhat Commands

```bash
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/interact.js --network sepolia
npx hardhat run scripts/demo-populate.js --network sepolia
```

### Frontend Integration

* ABIs stored in `frontend/src/lib/abi/`.
* Hooks:
  * `useChamaRegistry` – loads on-chain data into UI state via `wagmi` + React Query.
  * `useChamaActions` – encapsulates join & contribute flows (including ERC20 approvals).
* RainbowKit/Wagmi providers configured in `frontend/src/main.tsx`.

### Next Steps

* Verify contracts on Etherscan (`npx hardhat verify ...`).
* Record demo covering join + contribute flows.
* Update README with live addresses/links once deployed.

