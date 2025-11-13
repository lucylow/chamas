export const CONTRACTS = {
  FACTORY: import.meta.env.VITE_CHAMA_FACTORY_ADDRESS as `0x${string}` | undefined,
  USDC: import.meta.env.VITE_USDC_ADDRESS as `0x${string}` | undefined,
  CHAIN_ID: Number(import.meta.env.VITE_SEPOLIA_CHAIN_ID ?? 11155111),
};

export const DEFAULT_CHAIN_ID = 11155111;

export const REQUIRED_ENV_VARS = ["VITE_CHAMA_FACTORY_ADDRESS", "VITE_USDC_ADDRESS", "VITE_SEPOLIA_CHAIN_ID"] as const;

