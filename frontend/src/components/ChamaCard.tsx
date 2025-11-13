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
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{name}</CardTitle>
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          </div>
          <Badge variant={chama.status === 'active' ? 'default' : 'secondary'}>
            {chama.status === 'active' ? text.active : text.completed}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{text.members}</p>
              <p className="text-sm font-medium">
                {chama.members}/{chama.maxMembers}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{text.contribution}</p>
              <p className="text-sm font-medium">
                {formatCurrency(chama.contributionAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{text.totalSavings}</p>
              <p className="text-sm font-medium">
                {formatCurrency(chama.totalSavings)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">{text.nextPayout}</p>
              <p className="text-sm font-medium">{timeUntil}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {language === 'sw' ? 'Mzunguko' : 'Frequency'}: {frequency}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/chama/${chama.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            {text.viewDetails}
          </Button>
        </Link>
        {chama.members < chama.maxMembers && chama.status === 'active' && (
          <Button
            className="flex-1"
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
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {text.confirming}
              </span>
            ) : isConfirmed ? (
              <span className="flex items-center justify-center gap-2">
                {text.confirmed}
              </span>
            ) : isJoining ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {text.joining}
              </span>
            ) : (
              text.join
            )}
          </Button>
        )}
      </CardFooter>
      {error && (
        <div className="px-6 pb-4">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      {txHash && (
        <div className="px-6 pb-4">
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {language === 'sw' ? 'Ona muamala' : 'View transaction'}
          </a>
        </div>
      )}
    </Card>
  );
}

