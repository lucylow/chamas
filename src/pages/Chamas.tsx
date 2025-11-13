import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
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
    return chamas.filter((chama: Chama) => {
      const matchesSearch = searchTerm === '' || 
        chama.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chama.nameSwahili.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chama.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFrequency = filterFrequency === 'all' || chama.frequency === filterFrequency;
      
      return matchesSearch && matchesFrequency;
    });
  }, [chamas, searchTerm, filterFrequency]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-30">
        <div className="container py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-bold text-gradient bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                {text.title}
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">{text.subtitle}</p>
            </div>
            <Link href="/create">
              <Button size="lg" className="w-full md:w-auto shadow-md hover:shadow-lg transition-all hover:scale-105">
                <Plus className="mr-2 h-5 w-5" />
                {text.createNew}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                placeholder={text.search}
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 text-base border-2 focus:border-primary transition-colors"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterFrequency === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterFrequency('all')}
                className="transition-all hover:scale-105"
              >
                {text.all}
              </Button>
              <Button
                variant={filterFrequency === 'weekly' ? 'default' : 'outline'}
                onClick={() => setFilterFrequency('weekly')}
                className="transition-all hover:scale-105"
              >
                {text.weekly}
              </Button>
              <Button
                variant={filterFrequency === 'monthly' ? 'default' : 'outline'}
                onClick={() => setFilterFrequency('monthly')}
                className="transition-all hover:scale-105"
              >
                {text.monthly}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground font-medium">
              {text.showing} <span className="text-primary font-bold">{filteredChamas.length}</span> {text.of} <span className="font-semibold">{chamas.length || mockChamas.length}</span> {text.chamas}
            </div>
          </div>

          {backendError && (
            <div className="flex items-center gap-2 rounded-lg border-2 border-yellow-300 bg-yellow-50/80 backdrop-blur-sm px-4 py-3 text-sm text-yellow-800 shadow-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{backendError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chamas Grid */}
      <div className="container pb-16">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-base text-muted-foreground font-medium">{text.loading}</p>
          </div>
        ) : filteredChamas.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-xl font-semibold text-muted-foreground">{text.noResults}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {language === 'sw' 
                ? 'Jaribu kubadilisha vichujio au uunde chama kipya'
                : 'Try adjusting your filters or create a new chama'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredChamas.map((chama: Chama) => (
              <ChamaCard key={chama.id} chama={chama} language={language} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

