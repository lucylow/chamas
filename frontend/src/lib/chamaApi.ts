const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface RemoteChama {
  id: number;
  name: string;
  owner: string;
  members: number;
  active: boolean;
  contributionWei: string;
  contributionEth: number;
  totalFundsWei: string;
  totalFundsEth: number;
  contributionFrequency: number;
}

interface ChamaResponse {
  chamas: RemoteChama[];
}

export async function fetchChamas(limit = 6, signal?: AbortSignal): Promise<RemoteChama[]> {
  const url = new URL(`${API_URL}/chamas`);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    method: 'GET',
    signal,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Failed to load chamas: ${response.status} ${message}`);
  }

  const payload = (await response.json()) as ChamaResponse;
  return payload.chamas ?? [];
}


