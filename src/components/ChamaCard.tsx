import { useState } from 'react';
import { Users, Calendar, Coins, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Chama } from '@/lib/mockData';
import { formatCurrency, getTimeUntil, getTimeUntilSwahili } from '@/lib/utils';
import { Link } from 'wouter';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useChamaActions } from '@/hooks/useChamaActions';

interface ChamaCardProps {
  chama: Chama;
  language: 'sw' | 'en';
}

export default function ChamaCard({ chama, language }: ChamaCardProps) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    joinChama,
    isJoining,
    isValidChain,
    error: hookError,
    isConfirmed,
    isConfirming,
    txHash,
    requiredChainId,
  } = useChamaActions({
    chamaId: chama.onChainId,
    contributionAmount: chama.rawContributionAmount,
    tokenAddress: chama.contributionToken,
  });

  const error = hookError || localError;

  const text = {
    members: language === 'sw' ? 'Wanachama' : 'Members',
    contribution: language === 'sw' ? 'Mchango' : 'Contribution',
    totalSavings: language === 'sw' ? 'Jumla ya Akiba' : 'Total Savings',
    nextPayout: language === 'sw' ? 'Malipo Yajayo' : 'Next Payout',
    viewDetails: language === 'sw' ? 'Ona Maelezo' : 'View Details',
    join: language === 'sw' ? 'Jiunge' : 'Join',
    active: language === 'sw' ? 'Inafanya Kazi' : 'Active',
    completed: language === 'sw' ? 'Imekamilika' : 'Completed',
    weekly: language === 'sw' ? 'kila wiki' : 'weekly',
    monthly: language === 'sw' ? 'kila mwezi' : 'monthly',
    connectWallet: language === 'sw' ? 'Unganisha pochi yako kwanza' : 'Connect your wallet first',
    joinError: language === 'sw' ? 'Imeshindikana kujiunga na chama' : 'Unable to join chama',
    wrongNetwork: language === 'sw'
      ? `Tafadhali badilisha kwenye Sepolia network (Chain ID: ${requiredChainId})`
      : `Please switch to Sepolia network (Chain ID: ${requiredChainId})`,
    confirming: language === 'sw' ? 'Inathibitisha...' : 'Confirming...',
    confirmed: language === 'sw' ? 'Imefanikiwa!' : 'Success!',
    joining: language === 'sw' ? 'Inajiunga...' : 'Joining...',
  };

  const name = language === 'sw' ? chama.nameSwahili : chama.name;
  const description = language === 'sw' ? chama.descriptionSwahili : chama.description;
  const frequency = chama.frequency === 'weekly' ? text.weekly : text.monthly;
  const timeUntil = language === 'sw'
    ? getTimeUntilSwahili(chama.nextPayout)
    : getTimeUntil(chama.nextPayout);

  return (
    <Card className="group hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 border-2 border-border/50 hover:border-primary/70 bg-white/95 backdrop-blur-sm overflow-hidden rounded-2xl relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:pointer-events-none">
      <CardHeader className="pb-4 sm:pb-5 px-5 sm:px-7 pt-5 sm:pt-7 relative z-10">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl sm:text-2xl md:text-2xl mb-2 sm:mb-2.5 font-extrabold text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
              {name}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm sm:text-base leading-relaxed text-muted-foreground">
              {description}
            </CardDescription>
          </div>
          <Badge 
            variant={chama.status === 'active' ? 'default' : 'secondary'}
            className="shrink-0 ml-2 text-xs font-semibold px-2.5 py-1 rounded-lg"
          >
            {chama.status === 'active' ? text.active : text.completed}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 sm:space-y-6 px-5 sm:px-7 relative z-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 border border-border/30 hover:border-primary/30 hover:scale-[1.02] cursor-default">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors duration-200">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">{text.members}</p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {chama.members}/{chama.maxMembers}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 border border-border/30 hover:border-secondary/30 hover:scale-[1.02] cursor-default">
            <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0 group-hover:bg-secondary/20 transition-colors duration-200">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">{text.contribution}</p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {formatCurrency(chama.contributionAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 border border-border/30 hover:border-primary/30 hover:scale-[1.02] cursor-default">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors duration-200">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">{text.totalSavings}</p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {formatCurrency(chama.totalSavings)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all duration-200 border border-border/30 hover:border-accent/30 hover:scale-[1.02] cursor-default">
            <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 group-hover:bg-accent/20 transition-colors duration-200">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1">{text.nextPayout}</p>
              <p className="text-sm sm:text-base font-bold text-foreground">{timeUntil}</p>
            </div>
          </div>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {language === 'sw' ? 'Mzunguko' : 'Frequency'}: <span className="text-foreground font-bold">{frequency}</span>
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-5 px-5 sm:px-7 pb-5 sm:pb-7 relative z-10">
        <Link href={`/chama/${chama.id}`} className="flex-1 w-full sm:w-auto">
          <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base font-semibold py-2.5 rounded-xl border-2">
            {text.viewDetails}
          </Button>
        </Link>
        {chama.members < chama.maxMembers && chama.status === 'active' && (
          <Button
            className="flex-1 w-full sm:w-auto shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm sm:text-base font-semibold py-2.5 rounded-xl"
            disabled={isJoining || isConfirming || !chama.onChainId}
            onClick={async () => {
              if (!isConnected) {
                openConnectModal?.();
                return;
              }
              if (!isValidChain) {
                setLocalError(text.wrongNetwork);
                return;
              }
              if (!chama.onChainId) {
                setLocalError(text.joinError);
                return;
              }
              try {
                setLocalError(null);
                await joinChama();
              } catch (err: any) {
                const message = err?.message || text.joinError;
                setLocalError(message);
                console.error('Failed to join chama:', err);
              }
            }}
          >
            {isConfirming ? (
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm">{text.confirming}</span>
              </span>
            ) : isConfirmed ? (
              <span className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                {text.confirmed}
              </span>
            ) : isJoining ? (
              <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm">{text.joining}</span>
              </span>
            ) : (
              text.join
            )}
          </Button>
        )}
      </CardFooter>
      {error && (
        <div className="px-5 sm:px-7 pb-4 sm:pb-5">
          <div className="rounded-xl bg-destructive/10 border-2 border-destructive/20 px-4 py-3">
            <p className="text-xs sm:text-sm font-semibold text-destructive break-words">{error}</p>
          </div>
        </div>
      )}
      {txHash && (
        <div className="px-5 sm:px-7 pb-4 sm:pb-5">
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 hover:underline transition-colors inline-flex items-center gap-2 break-all"
          >
            {language === 'sw' ? 'Ona muamala' : 'View transaction'}
            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </Card>
  );
}

