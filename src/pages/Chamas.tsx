import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChamaCard from '@/components/ChamaCard';
import { mockChamas, type Chama } from '@/lib/mockData';
import { useChamaRegistry } from '@/hooks/useChamaRegistry';

interface ChamasProps {
  language: 'sw' | 'en';
}

export default function Chamas({ language }: ChamasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);
  const { data: onChainChamas, isLoading, error } = useChamaRegistry({ language });

  useEffect(() => {
    if (onChainChamas && onChainChamas.length > 0) {
      setChamas(onChainChamas);
      setBackendError(null);
      return;
    }

    if (!isLoading) {
      if (error) {
        console.error('Failed to load chamas from blockchain:', error);
        setBackendError(
          language === 'sw'
            ? 'Imeshindikana kupata data kutoka kwa blockchain. Tunaonyesha data ya mfano.'
            : 'Unable to load blockchain data. Showing demo data instead.'
        );
      }
      setChamas(mockChamas);
    }
  }, [onChainChamas, isLoading, error, language]);

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

