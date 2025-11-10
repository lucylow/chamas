import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
}

// Mock contract ABI for Chama
export const CHAMA_ABI = [
  'function createChama(string name, uint256 contributionAmount, uint256 frequency, uint256 maxMembers) public',
  'function joinChama(uint256 chamaId) public payable',
  'function contribute(uint256 chamaId) public payable',
  'function requestPayout(uint256 chamaId) public',
  'function getChama(uint256 chamaId) public view returns (tuple(string name, uint256 contributionAmount, uint256 frequency, uint256 members, uint256 totalSavings, address creator, bool active))',
  'event ChamaCreated(uint256 indexed chamaId, string name, address indexed creator)',
  'event MemberJoined(uint256 indexed chamaId, address indexed member)',
  'event ContributionMade(uint256 indexed chamaId, address indexed member, uint256 amount)',
  'event PayoutRequested(uint256 indexed chamaId, address indexed member, uint256 amount)',
];

// Sepolia testnet configuration
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/';

// Mock contract address (for demo)
export const CHAMA_CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

export async function connectWallet(): Promise<WalletState> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    const network = await provider.getNetwork();

    return {
      address,
      balance: ethers.formatEther(balance),
      chainId: Number(network.chainId),
      isConnected: true,
    };
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    throw new Error(error.message || 'Failed to connect wallet');
  }
}

export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't have a programmatic disconnect
  // User must disconnect from MetaMask extension
  console.log('Please disconnect from MetaMask extension');
}

export async function switchToSepolia(): Promise<void> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    });
  } catch (error: any) {
    // Chain not added, try to add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

export async function getWalletBalance(address: string): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    return '0';
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
}

// Mock transaction functions (for demo without real contract)
export async function mockCreateChama(
  name: string,
  contributionAmount: string,
  frequency: 'weekly' | 'monthly',
  maxMembers: number
): Promise<string> {
  // Simulate transaction delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate mock transaction hash
  const txHash = '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  console.log('Mock Chama Created:', { name, contributionAmount, frequency, maxMembers, txHash });
  return txHash;
}

export async function mockJoinChama(chamaId: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const txHash = '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  console.log('Mock Join Chama:', { chamaId, txHash });
  return txHash;
}

export async function mockContribute(chamaId: string, amount: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const txHash = '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  console.log('Mock Contribution:', { chamaId, amount, txHash });
  return txHash;
}

// Format address for display
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format ETH amount
export function formatEth(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(4);
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

