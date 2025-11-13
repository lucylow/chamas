import { useEffect, useState } from 'react';
import { checkBackendHealth, type HealthStatus } from '@/lib/healthApi';

interface UseBackendHealthOptions {
  pollInterval?: number; // milliseconds, 0 to disable polling
  enabled?: boolean;
}

export function useBackendHealth({ 
  pollInterval = 30000, 
  enabled = true 
}: UseBackendHealthOptions = {}) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshHealth = async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await checkBackendHealth(force);
      setHealth(status);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      // Set unhealthy status on error
      setHealth({
        healthy: false,
        services: {
          asr: false,
          llm: false,
          tts: false,
          chama: false,
        },
        timestamp: Date.now(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial health check
    refreshHealth();

    // Set up polling if interval is provided
    if (pollInterval > 0) {
      const interval = setInterval(() => {
        refreshHealth();
      }, pollInterval);

      return () => clearInterval(interval);
    }
  }, [pollInterval, enabled]);

  return {
    health,
    isLoading,
    error,
    refreshHealth: () => refreshHealth(true),
    isHealthy: health?.healthy ?? false,
    services: health?.services ?? {
      asr: false,
      llm: false,
      tts: false,
      chama: false,
    },
  };
}

