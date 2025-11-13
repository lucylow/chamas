const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface BackendHealth {
  asr: boolean;
  llm: boolean;
  tts: boolean;
  chama: boolean;
}

export interface HealthStatus {
  healthy: boolean;
  services: BackendHealth;
  timestamp: number;
}

let healthCache: HealthStatus | null = null;
let healthCacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

export async function checkBackendHealth(forceRefresh = false): Promise<HealthStatus> {
  const now = Date.now();
  
  // Return cached health if still valid
  if (!forceRefresh && healthCache && (now - healthCacheTime) < CACHE_DURATION) {
    return healthCache;
  }

  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const services = (await response.json()) as BackendHealth;
    const healthy = services.asr || services.llm || services.tts || services.chama;

    healthCache = {
      healthy,
      services,
      timestamp: now,
    };
    healthCacheTime = now;

    return healthCache;
  } catch (error) {
    // If backend is down, return unhealthy status
    healthCache = {
      healthy: false,
      services: {
        asr: false,
        llm: false,
        tts: false,
        chama: false,
      },
      timestamp: now,
    };
    healthCacheTime = now;

    console.warn('Backend health check failed:', error);
    return healthCache;
  }
}

export function clearHealthCache(): void {
  healthCache = null;
  healthCacheTime = 0;
}

