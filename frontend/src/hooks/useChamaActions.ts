import { useMemo, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from "wagmi";
import { CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { CHAMA_FACTORY_ABI } from "@/lib/abi/chamaFactory";
import { ERC20_ABI } from "@/lib/abi/erc20";

interface Options {
  chamaId?: bigint;
  contributionAmount?: bigint;
  tokenAddress?: `0x${string}` | string;
}

export function useChamaActions({ chamaId, contributionAmount, tokenAddress }: Options) {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { writeContractAsync, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  const factoryAddress = CONTRACTS.FACTORY ? (CONTRACTS.FACTORY as `0x${string}`) : undefined;
  const contribution = useMemo(() => {
    if (!contributionAmount) return undefined;
    return contributionAmount;
  }, [contributionAmount]);

  // Validate chain ID
  const isValidChain = currentChainId === (CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID);

  // Check token allowance
  const checkAllowance = async (tokenAddr: `0x${string}`, spender: `0x${string}`, amount: bigint): Promise<boolean> => {
    if (!publicClient || !address) return false;
    try {
      const allowance = (await publicClient.readContract({
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, spender],
      })) as bigint;
      return allowance >= amount;
    } catch (error) {
      console.error("Failed to check allowance:", error);
      return false;
    }
  };

  async function join() {
    setError(null);
    
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }
    
    if (!isValidChain) {
      throw new Error(
        `Please switch to Sepolia network (Chain ID: ${CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID}). Current: ${currentChainId}`
      );
    }
    
    if (!factoryAddress) {
      throw new Error("Factory address missing. Set VITE_CHAMA_FACTORY_ADDRESS in frontend/.env.local");
    }
    
    if (chamaId === undefined) {
      throw new Error("Chama identifier missing");
    }

    try {
      setIsProcessing(true);
      const hash = await writeContractAsync({
        address: factoryAddress,
        abi: CHAMA_FACTORY_ABI,
        functionName: "joinChama",
        args: [chamaId],
      });
      setTxHash(hash);
      return hash;
    } catch (err: any) {
      const errorMessage = err?.shortMessage || err?.message || "Failed to join chama";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  async function approveAndContribute() {
    setError(null);
    
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }
    
    if (!isValidChain) {
      throw new Error(
        `Please switch to Sepolia network (Chain ID: ${CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID}). Current: ${currentChainId}`
      );
    }
    
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

    const tokenAddr = tokenAddress as `0x${string}`;
    const amount = contribution;

    setIsProcessing(true);
    try {
      // Check if approval is needed
      const hasAllowance = await checkAllowance(tokenAddr, factoryAddress, amount);
      
      if (!hasAllowance) {
        // Approve token spending
        const approveHash = await writeContractAsync({
          address: tokenAddr,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [factoryAddress, amount],
        });
        setTxHash(approveHash);
        
        // Wait for approval confirmation
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // Contribute to chama
      const contributeHash = await writeContractAsync({
        address: factoryAddress,
        abi: CHAMA_FACTORY_ABI,
        functionName: "contribute",
        args: [chamaId, amount],
      });
      setTxHash(contributeHash);
      return contributeHash;
    } catch (err: any) {
      const errorMessage = err?.shortMessage || err?.message || "Failed to contribute";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    isConnected,
    isValidChain,
    joinChama: join,
    contribute: approveAndContribute,
    isJoining: isPending || isProcessing,
    isContributing: isProcessing,
    isConfirming,
    isConfirmed,
    txHash,
    error,
    chainId: currentChainId,
    requiredChainId: CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID,
  };
}

