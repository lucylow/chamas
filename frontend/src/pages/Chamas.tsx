import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { Search, Plus, Loader2, AlertTriangle, ChevronLeft, ChevronRight, X, Inbox } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChamaCard from '@/components/ChamaCard';
import { mockChamas, type Chama } from '@/lib/mockData';
import { useChamaRegistry } from '@/hooks/useChamaRegistry';

interface ChamasProps {
  language: 'sw' | 'en';
}

const ITEMS_PER_PAGE = 9;

// Loading skeleton component
const ChamaCardSkeleton = () => (
  <div className="rounded-xl border-2 bg-white/90 backdrop-blur-sm p-6 animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
        <div className="h-6 w-16 bg-muted rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="h-5 bg-muted rounded w-2/3"></div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-4">
        <div className="h-10 bg-muted rounded flex-1"></div>
        <div className="h-10 bg-muted rounded flex-1"></div>
      </div>
    </div>
  </div>
);

export default function Chamas({ language }: ChamasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [chamas, setChamas] = useState<Chama[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: onChainChamas, isLoading, error } = useChamaRegistry({ language });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const typedChamas: Chama[] | undefined = Array.isArray(onChainChamas) ? onChainChamas : undefined;
    if (typedChamas && typedChamas.length > 0) {
      setChamas(typedChamas);
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
    page: language === 'sw' ? 'Ukurasa' : 'Page',
    previous: language === 'sw' ? 'Iliyotangulia' : 'Previous',
    next: language === 'sw' ? 'Ijayo' : 'Next',
  };

  const filteredChamas = useMemo(() => {
    return chamas.filter((chama: Chama) => {
      const matchesSearch = debouncedSearchTerm === '' || 
        chama.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        chama.nameSwahili.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        chama.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesFrequency = filterFrequency === 'all' || chama.frequency === filterFrequency;
      
      return matchesSearch && matchesFrequency;
    });
  }, [chamas, debouncedSearchTerm, filterFrequency]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterFrequency]);

  const totalPages = Math.ceil(filteredChamas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedChamas = filteredChamas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    const maxPage = Math.ceil(filteredChamas.length / ITEMS_PER_PAGE);
    const newPage = Math.max(1, Math.min(page, maxPage));
    setCurrentPage(newPage);
    // Smooth scroll to top with offset for sticky header
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keyboard navigation for pagination
  useEffect(() => {
    if (totalPages <= 1) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b shadow-sm sticky top-0 z-30 transition-all duration-200">
        <div className="container px-4 sm:px-6 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 md:gap-6">
            <div className="space-y-1 sm:space-y-1.5">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent leading-tight">
                {text.title}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{text.subtitle}</p>
            </div>
            <Link href="/create">
              <Button 
                size="lg" 
                className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-sm sm:text-base"
              >
                <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {text.createNew}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <div className="bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl border shadow-lg p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 transition-all duration-200 hover:shadow-xl">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder={text.search}
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-9 sm:pl-11 pr-9 sm:pr-10 h-11 sm:h-12 text-sm sm:text-base border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterFrequency === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterFrequency('all')}
                className="transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-xs sm:text-sm px-3 sm:px-4"
              >
                {text.all}
              </Button>
              <Button
                variant={filterFrequency === 'weekly' ? 'default' : 'outline'}
                onClick={() => setFilterFrequency('weekly')}
                className="transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-xs sm:text-sm px-3 sm:px-4"
              >
                {text.weekly}
              </Button>
              <Button
                variant={filterFrequency === 'monthly' ? 'default' : 'outline'}
                onClick={() => setFilterFrequency('monthly')}
                className="transition-all duration-200 hover:scale-105 active:scale-95 font-medium text-xs sm:text-sm px-3 sm:px-4"
              >
                {text.monthly}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/50">
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              {text.showing} <span className="text-primary font-bold">
                {filteredChamas.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredChamas.length)}
              </span> {text.of} <span className="font-semibold text-foreground">{filteredChamas.length}</span> {text.chamas}
              {totalPages > 1 && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold text-xs">
                  {text.page} {currentPage} {text.of} {totalPages}
                </span>
              )}
            </div>
            {(searchTerm || filterFrequency !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearSearch();
                  setFilterFrequency('all');
                }}
                className="text-xs"
              >
                {language === 'sw' ? 'Ondoa vichujio' : 'Clear filters'}
              </Button>
            )}
          </div>

          {backendError && (
            <div className="flex items-center gap-3 rounded-lg border-2 border-yellow-300/50 bg-gradient-to-r from-yellow-50/90 to-yellow-50/50 backdrop-blur-sm px-4 py-3 text-sm text-yellow-900 shadow-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
              <span className="flex-1">{backendError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chamas Grid */}
      <div className="container px-4 sm:px-6 pb-8 sm:pb-12 md:pb-16">
        {isLoading ? (
          <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
              <p className="text-sm sm:text-base text-muted-foreground font-medium">{text.loading}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <ChamaCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : filteredChamas.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-24 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-muted/50 to-muted mb-4 sm:mb-6 animate-pulse">
              <Inbox className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{text.noResults}</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
              {language === 'sw' 
                ? 'Jaribu kubadilisha vichujio au uunde chama kipya'
                : 'Try adjusting your filters or create a new chama'}
            </p>
            {(searchTerm || filterFrequency !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  clearSearch();
                  setFilterFrequency('all');
                }}
                className="mt-2 text-sm"
              >
                {language === 'sw' ? 'Ondoa vichujio' : 'Clear filters'}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {paginatedChamas.map((chama: Chama, index) => (
                <div
                  key={chama.id}
                  className="opacity-0 animate-fade-in"
                  style={{ 
                    animationDelay: `${index * 50}ms`, 
                    animationFillMode: 'forwards',
                    animationDuration: '400ms'
                  }}
                >
                  <ChamaCard chama={chama} language={language} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 opacity-0 animate-fade-in px-4" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-xs sm:text-sm"
                  aria-label={text.previous}
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{text.previous}</span>
                </Button>

                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-1.5 sm:px-2 py-1 text-muted-foreground text-xs sm:text-sm">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[2rem] sm:min-w-[2.5rem] text-xs sm:text-sm transition-all duration-200 hover:scale-110 active:scale-95"
                        aria-label={`${text.page} ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-xs sm:text-sm"
                  aria-label={text.next}
                >
                  <span className="hidden sm:inline">{text.next}</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

