import { useMemo, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/lib/constants";
import { CHAMA_FACTORY_ABI } from "@/lib/abi/chamaFactory";
import { ERC20_ABI } from "@/lib/abi/erc20";

interface Options {
  chamaId?: bigint;
  contributionAmount?: bigint;
  tokenAddress?: `0x${string}` | string;
}

export function useChamaActions({ chamaId, contributionAmount, tokenAddress }: Options) {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);

  const factoryAddress = CONTRACTS.FACTORY ? (CONTRACTS.FACTORY as `0x${string}`) : undefined;
  const contribution = useMemo(() => {
    if (!contributionAmount) return undefined;
    return contributionAmount;
  }, [contributionAmount]);

  async function join() {
    if (!factoryAddress) {
      throw new Error("Factory address missing. Set VITE_CHAMA_FACTORY_ADDRESS in frontend/.env.local");
    }
    if (chamaId === undefined) {
      throw new Error("Chama identifier missing");
    }

    await writeContractAsync({
      address: factoryAddress,
      abi: CHAMA_FACTORY_ABI,
      functionName: "joinChama",
      args: [chamaId],
    });
  }

  async function approveAndContribute() {
    if (!factoryAddress) {
      throw new Error("Factory address missing. Set VITE_CHAMA_FACTORY_ADDRESS in frontend/.env.local");
    }
    if (!chamaId) {
      throw new Error("Chama identifier missing");
    }
    if (!contribution) {
      throw new Error("Contribution amount not available");
    }
    if (!tokenAddress) {
      throw new Error("Contribution token address missing");
    }
    if (!isConnected || !address) {
      throw new Error("Connect your wallet to contribute");
    }

    const amount = contribution;

    setIsProcessing(true);
    try {
      await writeContractAsync({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [factoryAddress, amount],
      });

      await writeContractAsync({
        address: factoryAddress,
        abi: CHAMA_FACTORY_ABI,
        functionName: "contribute",
        args: [chamaId, amount],
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    isConnected,
    joinChama: join,
    contribute: approveAndContribute,
    isJoining: isPending,
    isContributing: isProcessing,
  };
}

