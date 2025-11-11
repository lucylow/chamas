import { useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChamaCard from '@/components/ChamaCard';
import { mockChamas } from '@/lib/mockData';

interface ChamasProps {
  language: 'sw' | 'en';
}

export default function Chamas({ language }: ChamasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'weekly' | 'monthly'>('all');

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
  };

  const filteredChamas = mockChamas.filter(chama => {
    const matchesSearch = searchTerm === '' || 
      chama.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chama.nameSwahili.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chama.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFrequency = filterFrequency === 'all' || chama.frequency === filterFrequency;
    
    return matchesSearch && matchesFrequency;
  });

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
          {text.showing} {filteredChamas.length} {text.of} {mockChamas.length} {text.chamas}
        </div>
      </div>

      {/* Chamas Grid */}
      <div className="container pb-12">
        {filteredChamas.length === 0 ? (
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

