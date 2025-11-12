import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL ?? sepolia.rpcUrls.default.http[0];

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: "metaMask" }),
    ...(projectId
      ? [
          walletConnect({
            projectId,
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [sepolia.id]: http(rpcUrl),
  },
  ssr: true,
});

