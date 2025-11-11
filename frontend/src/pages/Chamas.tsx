import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChamaCard from '@/components/ChamaCard';
import { mockChamas, type Chama } from '@/lib/mockData';
import { fetchChamas, type RemoteChama } from '@/lib/chamaApi';

interface ChamasProps {
  language: 'sw' | 'en';
}

export default function Chamas({ language }: ChamasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadChamas() {
      try {
        setIsLoading(true);
        setBackendError(null);
        const remote = await fetchChamas(9, controller.signal);
        if (!remote.length) {
          setChamas(mockChamas);
          return;
        }
        const hydrated = remote.map((item, index) => {
          const fallback = mockChamas[index] ?? mockChamas.find(chama => chama.id === `chama-${item.id}`);
          return transformRemoteChama(item, fallback);
        });
        setChamas(hydrated);
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('Failed to fetch chamas from backend:', error);
        setBackendError(
          language === 'sw'
            ? 'Imeshindikana kupata data kutoka kwa blockchain. Tunaonyesha data ya mfano.'
            : 'Unable to load blockchain data. Showing demo data instead.'
        );
        setChamas(mockChamas);
      } finally {
        setIsLoading(false);
      }
    }

    loadChamas();

    return () => controller.abort();
  }, [language]);

  const text = {
    title: language === 'sw' ? 'Chamas Zilizopo' : 'Available Chamas',
    subtitle: language === 'sw'
      ? 'Jiunge na chama au unda kipya'
      : 'Join a chama or create a new one',
    search: language === 'sw' ? 'Tafuta chama...' : 'Search chamas...',
    filter: language === 'sw' ? 'Chuja' : 'Filter',
    createNew: language === 'sw' ? 'Unda Chama Kipya' : 'Create New Chama',
    all: language === 'sw' ? 'Zote' : 'All',
    weekly: language === 'sw' ? 'Kila Wiki' : 'Weekly',
    monthly: language === 'sw' ? 'Kila Mwezi' : 'Monthly',
    noResults: language === 'sw' 
      ? 'Hakuna chamas zilizopatikana'
      : 'No chamas found',
    showing: language === 'sw' ? 'Inaonyesha' : 'Showing',
    of: language === 'sw' ? 'ya' : 'of',
    chamas: language === 'sw' ? 'chamas' : 'chamas',
    loading: language === 'sw' ? 'Inabeba data kutoka kwa blockchain...' : 'Loading blockchain data...',
  };

  const filteredChamas = useMemo(() => {
    return chamas.filter(chama => {
      const matchesSearch = searchTerm === '' || 
        chama.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chama.nameSwahili.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chama.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFrequency = filterFrequency === 'all' || chama.frequency === filterFrequency;
      
      return matchesSearch && matchesFrequency;
    });
  }, [chamas, searchTerm, filterFrequency]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{text.title}</h1>
              <p className="text-muted-foreground mt-2">{text.subtitle}</p>
            </div>
            <Link href="/create">
              <Button size="lg" className="w-full md:w-auto">
                <Plus className="mr-2 h-5 w-5" />
                {text.createNew}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={text.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterFrequency === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterFrequency('all')}
            >
              {text.all}
            </Button>
            <Button
              variant={filterFrequency === 'weekly' ? 'default' : 'outline'}
              onClick={() => setFilterFrequency('weekly')}
            >
              {text.weekly}
            </Button>
            <Button
              variant={filterFrequency === 'monthly' ? 'default' : 'outline'}
              onClick={() => setFilterFrequency('monthly')}
            >
              {text.monthly}
            </Button>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          {text.showing} {filteredChamas.length} {text.of} {chamas.length || mockChamas.length} {text.chamas}
        </div>

        {backendError && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span>{backendError}</span>
          </div>
        )}
      </div>

      {/* Chamas Grid */}
      <div className="container pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">{text.loading}</p>
          </div>
        ) : filteredChamas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">{text.noResults}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChamas.map(chama => (
              <ChamaCard key={chama.id} chama={chama} language={language} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function transformRemoteChama(remote: RemoteChama, fallback?: Chama): Chama {
  const weekInSeconds = 60 * 60 * 24 * 10;
  const frequency = remote.contributionFrequency > 0 && remote.contributionFrequency <= weekInSeconds ? 'weekly' : 'monthly';
  const fallbackNextPayout =
    fallback?.nextPayout ??
    new Date(Date.now() + (remote.contributionFrequency > 0 ? remote.contributionFrequency : 60 * 60 * 24 * 30) * 1000);

  const contributionEth = Number(remote.contributionEth ?? 0);
  const totalFundsEth = Number(remote.totalFundsEth ?? 0);

  const ownerShort = remote.owner
    ? `${remote.owner.slice(0, 6)}...${remote.owner.slice(-4)}`
    : '0x0000...0000';

  return {
    id: `chama-${remote.id}`,
    name: remote.name,
    nameSwahili: fallback?.nameSwahili ?? remote.name,
    description: fallback?.description ?? `Community savings pool managed by ${ownerShort}`,
    descriptionSwahili: fallback?.descriptionSwahili ?? `Chama cha jamii kinachosimamiwa na ${ownerShort}`,
    contributionAmount: contributionEth.toFixed(4),
    frequency,
    members: remote.members,
    maxMembers: fallback?.maxMembers ?? Math.max(remote.members + 5, remote.members || 10),
    totalSavings: totalFundsEth.toFixed(4),
    contractAddress: fallback?.contractAddress ?? remote.owner,
    nextPayout: fallbackNextPayout,
    createdBy: fallback?.createdBy ?? remote.owner,
    status: remote.active ? 'active' : 'completed',
  };
}

