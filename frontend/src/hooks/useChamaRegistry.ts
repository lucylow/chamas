import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatUnits } from "ethers";
import { CONTRACTS, DEFAULT_CHAIN_ID } from "@/lib/constants";
import { CHAMA_FACTORY_ABI } from "@/lib/abi/chamaFactory";
import { CHAMA_ABI } from "@/lib/abi/chama";
import { ERC20_ABI } from "@/lib/abi/erc20";
import type { Chama } from "@/lib/mockData";

type FetchOptions = {
  language: "sw" | "en";
};

const DECIMALS_CACHE = new Map<string, number>();

async function getTokenDecimals(
  publicClient: ReturnType<typeof usePublicClient>,
  tokenAddress: `0x${string}`
): Promise<number> {
  if (DECIMALS_CACHE.has(tokenAddress)) {
    return DECIMALS_CACHE.get(tokenAddress)!;
  }

  const decimals = (await publicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
  })) as bigint;

  const parsed = Number(decimals);
  DECIMALS_CACHE.set(tokenAddress, parsed);
  return parsed;
}

export function useChamaRegistry({ language }: FetchOptions) {
  const publicClient = usePublicClient({ chainId: CONTRACTS.CHAIN_ID ?? DEFAULT_CHAIN_ID });

  return useQuery<Chama[]>({
    queryKey: ["chamas", CONTRACTS.FACTORY, language],
    enabled: Boolean(publicClient && CONTRACTS.FACTORY),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!publicClient) {
        throw new Error("Public client not ready");
      }
      if (!CONTRACTS.FACTORY) {
        throw new Error("Factory address missing. Set VITE_CHAMA_FACTORY_ADDRESS in frontend/.env.local");
      }

      const factoryAddress = CONTRACTS.FACTORY as `0x${string}`;
      const rawIds = (await publicClient.readContract({
        address: factoryAddress,
        abi: CHAMA_FACTORY_ABI,
        functionName: "getActiveChamaIds",
      })) as bigint[];

      if (!rawIds.length) {
        return [];
      }

      const chamaData = await Promise.all(
        rawIds.map(async (chamaId) => {
          const details = (await publicClient.readContract({
            address: factoryAddress,
            abi: CHAMA_FACTORY_ABI,
            functionName: "getChamaDetails",
            args: [chamaId],
          })) as unknown as {
            id: bigint;
            contractAddress: `0x${string}`;
            name: string;
            description: string;
            creator: `0x${string}`;
            tokenAddress: `0x${string}`;
            contributionAmount: bigint;
            contributionFrequency: bigint;
            maxMembers: bigint;
            createdAt: bigint;
            active: boolean;
          };

          const members = (await publicClient.readContract({
            address: factoryAddress,
            abi: CHAMA_FACTORY_ABI,
            functionName: "getChamaMembers",
            args: [chamaId],
          })) as `0x${string}`[];

          const nextRotationTime = (await publicClient.readContract({
            address: details.contractAddress,
            abi: CHAMA_ABI,
            functionName: "nextRotationTime",
          })) as bigint;

          const decimals = await getTokenDecimals(publicClient, details.tokenAddress);
          const contributionFormatted = formatUnits(details.contributionAmount, decimals);

          const tokenBalance = (await publicClient.readContract({
            address: details.tokenAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [details.contractAddress],
          })) as bigint;

          const totalSavings = formatUnits(tokenBalance, decimals);

          const fallbackName = details.name;
          const fallbackDescription =
            details.description ||
            (language === "sw"
              ? `Jamii ya akiba inayoongozwa na ${shortenAddress(details.creator)}`
              : `Community savings group led by ${shortenAddress(details.creator)}`);

          return {
            id: `chama-${details.id.toString()}`,
            onChainId: details.id,
            name: fallbackName,
            nameSwahili: fallbackName,
            description: details.description || fallbackDescription,
            descriptionSwahili: details.description || fallbackDescription,
            contributionAmount: contributionFormatted,
            rawContributionAmount: details.contributionAmount,
            frequency: inferFrequency(details.contributionFrequency),
            members: members.length,
            maxMembers: Number(details.maxMembers),
            totalSavings,
            contractAddress: details.contractAddress,
            contributionToken: details.tokenAddress,
            nextPayout: new Date(Number(nextRotationTime) * 1000),
            createdBy: details.creator,
            status: details.active ? "active" : "completed",
          } satisfies Chama;
        })
      );

      return chamaData;
    },
  });
}

function inferFrequency(contributionFrequency: bigint): "weekly" | "monthly" {
  const week = 7n * 24n * 60n * 60n;
  return contributionFrequency <= week ? "weekly" : "monthly";
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

