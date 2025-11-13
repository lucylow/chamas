import { useState } from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { Home as HomeIcon, Users, Plus, Menu, X, Globe } from 'lucide-react';
import { Button } from './components/ui/button';
import SwahiliChatbot from './components/SwahiliChatbot';
import Home from './pages/Home';
import Chamas from './pages/Chamas';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function App() {
  const [language, setLanguage] = useState<'sw' | 'en'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const text = {
    appName: 'Chamas',
    tagline: language === 'sw' ? 'Akiba ya Jamii' : 'Community Savings',
    nav: {
      home: language === 'sw' ? 'Nyumbani' : 'Home',
      chamas: 'Chamas',
      create: language === 'sw' ? 'Unda' : 'Create',
    },
  };

  const navItems = [
    { href: '/', icon: HomeIcon, label: text.nav.home },
    { href: '/chamas', icon: Users, label: text.nav.chamas },
    { href: '/create', icon: Plus, label: text.nav.create },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass border-b sticky top-0 z-40 shadow-sm">
        <div className="container px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl text-primary">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                {text.appName}
                <span className="hidden sm:inline text-xs sm:text-sm font-normal text-muted-foreground">
                  {text.tagline}
                </span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
                      {item.label}
                    </a>
                  </Link>
                );
              })}
              
              <div className="ml-4 pl-4 border-l border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {language === 'sw' ? '🇰🇪 SW' : '🇬🇧 EN'}
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 sm:py-4 border-t animate-in slide-in-from-top-2">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <a
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          active
                            ? 'bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-muted-foreground hover:text-primary hover:bg-muted/50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} />
                        {item.label}
                      </a>
                    </Link>
                  );
                })}
                
                <div className="pt-2 mt-2 border-t border-border space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLanguage(language === 'sw' ? 'en' : 'sw');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-sm"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {language === 'sw' ? 'Switch to English' : 'Badilisha kwa Kiswahili'}
                  </Button>
                  <div className="px-1">
                    <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <Home language={language} />
          </Route>
          <Route path="/chamas">
            <Chamas language={language} />
          </Route>
          <Route path="/create">
            <div className="container px-4 sm:px-6 py-8 sm:py-12">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {language === 'sw' ? 'Unda Chama Kipya' : 'Create New Chama'}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                {language === 'sw' 
                  ? 'Inakuja hivi karibuni...'
                  : 'Coming soon...'}
              </p>
            </div>
          </Route>
          <Route>
            <div className="container px-4 sm:px-6 py-8 sm:py-12 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold">404</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                {language === 'sw' ? 'Ukurasa haujapatikana' : 'Page not found'}
              </p>
            </div>
          </Route>
        </Switch>
      </main>

      {/* Footer */}
      <footer className="gradient-hero text-white py-8 sm:py-12 mt-8 sm:mt-12">
        <div className="container px-4 sm:px-6 text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-xl sm:text-2xl font-bold">{text.appName}</span>
          </div>
          <p className="text-xs sm:text-sm text-white/80">
            {language === 'sw'
              ? '© 2025 Chamas. Haki zote zimehifadhiwa.'
              : '© 2025 Chamas. All rights reserved.'}
          </p>
          <p className="text-[10px] sm:text-xs text-white/60">
            {language === 'sw'
              ? 'Inayotumia Ethereum • Msaidizi wa A.I. wa Kiswahili'
              : 'Powered by Ethereum • Swahili AI Assistant'}
          </p>
        </div>
      </footer>

      {/* Swahili AI Chatbot */}
      <SwahiliChatbot language={language} onLanguageChange={setLanguage} />
    </div>
  );
}

export default App;

