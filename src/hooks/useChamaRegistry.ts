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
  publicClient: NonNullable<ReturnType<typeof usePublicClient>>,
  tokenAddress: `0x${string}`
): Promise<number> {
  if (DECIMALS_CACHE.has(tokenAddress)) {
    return DECIMALS_CACHE.get(tokenAddress)!;
  }

  try {
    const decimals = (await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "decimals",
    })) as bigint;

    const parsed = Number(decimals);
    DECIMALS_CACHE.set(tokenAddress, parsed);
    return parsed;
  } catch (error) {
    console.error(`Failed to get decimals for token ${tokenAddress}:`, error);
    // Default to 18 decimals if call fails (most ERC20 tokens use 18)
    return 18;
  }
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
          try {
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
              archived: boolean;
              totalContributed: bigint;
            };

            let members: `0x${string}`[] = [];
            try {
              // Read members directly from the Chama contract
              members = (await publicClient.readContract({
                address: details.contractAddress,
                abi: CHAMA_ABI,
                functionName: "members",
              })) as `0x${string}`[];
            } catch (error) {
              console.error(`Failed to get members for chama ${chamaId}:`, error);
              // Try to get memberCount as fallback (not used currently but kept for future use)
              try {
                await publicClient.readContract({
                  address: details.contractAddress,
                  abi: CHAMA_ABI,
                  functionName: "memberCount",
                });
                // If we can't get the list, we at least know the count
                // Return empty array but the count will be used elsewhere if available
              } catch (countError) {
                console.error(`Failed to get memberCount for chama ${chamaId}:`, countError);
              }
            }

            let nextRotationTime = BigInt(0);
            try {
              nextRotationTime = (await publicClient.readContract({
                address: details.contractAddress,
                abi: CHAMA_ABI,
                functionName: "nextRotationTime",
              })) as bigint;
            } catch (error) {
              console.error(`Failed to get nextRotationTime for chama ${chamaId}:`, error);
              // Use createdAt + frequency as fallback
              const frequencyInSeconds = Number(details.contributionFrequency);
              nextRotationTime = details.createdAt + BigInt(frequencyInSeconds);
            }

            const decimals = await getTokenDecimals(publicClient, details.tokenAddress);
            const contributionFormatted = formatUnits(details.contributionAmount, decimals);

            let tokenBalance = BigInt(0);
            try {
              tokenBalance = (await publicClient.readContract({
                address: details.tokenAddress,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [details.contractAddress],
              })) as bigint;
            } catch (error) {
              console.error(`Failed to get balance for chama ${chamaId}:`, error);
              // Use totalContributed as fallback
              tokenBalance = details.totalContributed;
            }

            const totalSavings = formatUnits(tokenBalance, decimals);

            const fallbackName = details.name || `Chama ${chamaId.toString()}`;
            const fallbackDescription =
              details.description ||
              (language === "sw"
                ? `Jamii ya akiba inayoongozwa na ${shortenAddress(details.creator)}`
                : `Community savings group led by ${shortenAddress(details.creator)}`);

            // Contract uses archived, frontend uses active status
            const isActive = !details.archived;

            const chama: Chama = {
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
              status: isActive ? "active" : "completed",
            };
            return chama;
          } catch (error) {
            console.error(`Failed to load chama ${chamaId}:`, error);
            // Return null for failed chamas, filter them out later
            return null;
          }
        })
      );

      // Filter out null values (failed chamas)
      const validChamas: Chama[] = [];
      for (const chama of chamaData) {
        if (chama !== null) {
          validChamas.push(chama);
        }
      }
      return validChamas;
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

