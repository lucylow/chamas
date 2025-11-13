/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_CHAMA_FACTORY_ADDRESS?: string;
  readonly VITE_USDC_ADDRESS?: string;
  readonly VITE_SEPOLIA_CHAIN_ID?: string;
  readonly VITE_SEPOLIA_RPC_URL?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_APP_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

