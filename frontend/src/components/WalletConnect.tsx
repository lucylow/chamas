import { useState, useEffect } from 'react';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { connectWallet, formatAddress, formatEth, WalletState } from '@/lib/ethereum';

interface WalletConnectProps {
  language: 'sw' | 'en';
}

export default function WalletConnect({ language }: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    chainId: null,
    isConnected: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if already connected
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  async function checkConnection() {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await handleConnect();
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  }

  async function handleConnect() {
    setIsConnecting(true);
    setError(null);
    
    try {
      const walletState = await connectWallet();
      setWallet(walletState);
    } catch (err: any) {
      setError(err.message);
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  }

  function handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      // User disconnected
      setWallet({
        address: null,
        balance: null,
        chainId: null,
        isConnected: false,
      });
    } else {
      // Account changed
      handleConnect();
    }
  }

  function handleDisconnect() {
    setWallet({
      address: null,
      balance: null,
      chainId: null,
      isConnected: false,
    });
  }

  const text = {
    connect: language === 'sw' ? 'Unganisha Mkoba' : 'Connect Wallet',
    disconnect: language === 'sw' ? 'Tenganisha' : 'Disconnect',
    connecting: language === 'sw' ? 'Inaunganisha...' : 'Connecting...',
    balance: language === 'sw' ? 'Salio' : 'Balance',
    noMetaMask: language === 'sw' 
      ? 'MetaMask haijasanikishwa. Tafadhali sakinisha MetaMask kuendelea.'
      : 'MetaMask is not installed. Please install MetaMask to continue.',
  };

  if (typeof window.ethereum === 'undefined') {
    return (
      <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <p className="text-sm text-yellow-800">{text.noMetaMask}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open('https://metamask.io/download/', '_blank')}
        >
          {language === 'sw' ? 'Sakinisha MetaMask' : 'Install MetaMask'}
        </Button>
      </div>
    );
  }

  if (wallet.isConnected && wallet.address) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <Wallet className="h-5 w-5 text-green-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-900">
              {formatAddress(wallet.address)}
            </span>
            <span className="text-xs text-green-700">
              {text.balance}: {formatEth(wallet.balance || '0')} ETH
            </span>
          </div>
        </div>
        <Badge variant="default" className="bg-green-600">
          {language === 'sw' ? 'Imeunganishwa' : 'Connected'}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDisconnect}
          className="text-green-700 hover:text-green-900"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="w-full sm:w-auto"
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnecting ? text.connecting : text.connect}
      </Button>
    </div>
  );
}

