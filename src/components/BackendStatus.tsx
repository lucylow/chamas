import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useBackendHealth } from '@/hooks/useBackendHealth';

interface BackendStatusProps {
  language: 'sw' | 'en';
  compact?: boolean;
}

export default function BackendStatus({ language, compact = false }: BackendStatusProps) {
  const { health, isLoading, refreshHealth, services, isHealthy } = useBackendHealth({
    pollInterval: 30000, // Poll every 30 seconds
    enabled: true,
  });

  const text = {
    title: language === 'sw' ? 'Hali ya Huduma' : 'Service Status',
    refresh: language === 'sw' ? 'Onyesha Upya' : 'Refresh',
    services: {
      asr: language === 'sw' ? 'Utambuzi wa Sauti' : 'Speech Recognition',
      llm: language === 'sw' ? 'Mfumo wa Akili Bandia' : 'AI Language Model',
      tts: language === 'sw' ? 'Uzalishaji wa Sauti' : 'Text-to-Speech',
      chama: language === 'sw' ? 'Blockchain' : 'Blockchain',
    },
    status: {
      ready: language === 'sw' ? 'Tayari' : 'Ready',
      unavailable: language === 'sw' ? 'Haipatikani' : 'Unavailable',
      checking: language === 'sw' ? 'Inaangalia...' : 'Checking...',
    },
    overall: {
      healthy: language === 'sw' ? 'Huduma Zote Zinatumika' : 'All Services Operational',
      degraded: language === 'sw' ? 'Huduma Nyingine Hazipatikani' : 'Some Services Unavailable',
      unavailable: language === 'sw' ? 'Huduma Haipatikani' : 'Services Unavailable',
    },
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : isHealthy ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            {isLoading 
              ? text.status.checking 
              : isHealthy 
                ? text.overall.healthy 
                : text.overall.degraded}
          </span>
        </div>
        {health && !isLoading && (
          <div className="flex flex-wrap items-center gap-1.5 justify-center">
            {Object.entries(services).map(([key, status]) => (
              status && (
                <Badge key={key} variant="outline" className="h-4 px-1.5 text-[10px] bg-green-500/10 border-green-500/50">
                  {key.toUpperCase()}
                </Badge>
              )
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isHealthy ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          {text.title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshHealth()}
          disabled={isLoading}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(services).map(([key, status]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {text.services[key as keyof typeof text.services]}
            </span>
            <Badge
              variant={status ? 'default' : 'secondary'}
              className={status ? 'bg-green-500' : 'bg-muted'}
            >
              {status ? (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {text.status.ready}
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  {text.status.unavailable}
                </>
              )}
            </Badge>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t text-xs text-muted-foreground">
        {isHealthy ? (
          <p className="text-green-600 dark:text-green-400">{text.overall.healthy}</p>
        ) : (
          <p className="text-yellow-600 dark:text-yellow-400">
            {text.overall.degraded}
            {language === 'sw' 
              ? ' (Maandishi bado yanafanya kazi)'
              : ' (Text features still work)'}
          </p>
        )}
        {health && (
          <p className="mt-1 opacity-70">
            {language === 'sw' ? 'Mwisho iliangaliwa:' : 'Last checked:'}{' '}
            {new Date(health.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

