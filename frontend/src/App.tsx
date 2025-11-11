import { useState } from 'react';
import { Route, Switch, Link } from 'wouter';
import { Home as HomeIcon, Users, Plus, Menu, X, Globe } from 'lucide-react';
import { Button } from './components/ui/button';
import SwahiliChatbot from './components/SwahiliChatbot';
import Home from './pages/Home';
import Chamas from './pages/Chamas';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function App() {
  const [language, setLanguage] = useState<'sw' | 'en'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const text = {
    appName: 'Chamas',
    tagline: language === 'sw' ? 'Akiba ya Jamii' : 'Community Savings',
    nav: {
      home: language === 'sw' ? 'Nyumbani' : 'Home',
      chamas: 'Chamas',
      create: language === 'sw' ? 'Unda' : 'Create',
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="glass border-b sticky top-0 z-40 shadow-sm">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <a className="flex items-center gap-2 font-bold text-xl text-primary">
                <Users className="h-6 w-6" />
                {text.appName}
                <span className="hidden sm:inline text-sm font-normal text-muted-foreground">
                  {text.tagline}
                </span>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/">
                <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <HomeIcon className="h-4 w-4" />
                  {text.nav.home}
                </a>
              </Link>
              <Link href="/chamas">
                <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Users className="h-4 w-4" />
                  {text.nav.chamas}
                </a>
              </Link>
              <Link href="/create">
                <a className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                  {text.nav.create}
                </a>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')}
                className="ml-4"
              >
                <Globe className="h-4 w-4 mr-2" />
                {language === 'sw' ? '🇰🇪 SW' : '🇬🇧 EN'}
              </Button>
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
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col gap-4">
                <Link href="/">
                  <a
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HomeIcon className="h-4 w-4" />
                    {text.nav.home}
                  </a>
                </Link>
                <Link href="/chamas">
                  <a
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    {text.nav.chamas}
                  </a>
                </Link>
                <Link href="/create">
                  <a
                    className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    {text.nav.create}
                  </a>
                </Link>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLanguage(language === 'sw' ? 'en' : 'sw');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {language === 'sw' ? 'Switch to English' : 'Badilisha kwa Kiswahili'}
                </Button>
                <div className="mt-2">
                  <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
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
            <div className="container py-12">
              <h1 className="text-3xl font-bold">
                {language === 'sw' ? 'Unda Chama Kipya' : 'Create New Chama'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {language === 'sw' 
                  ? 'Inakuja hivi karibuni...'
                  : 'Coming soon...'}
              </p>
            </div>
          </Route>
          <Route>
            <div className="container py-12 text-center">
              <h1 className="text-3xl font-bold">404</h1>
              <p className="text-muted-foreground mt-2">
                {language === 'sw' ? 'Ukurasa haujapatikana' : 'Page not found'}
              </p>
            </div>
          </Route>
        </Switch>
      </main>

      {/* Footer */}
      <footer className="gradient-hero text-white py-12 mt-12">
        <div className="container text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-6 w-6" />
            <span className="text-2xl font-bold">{text.appName}</span>
          </div>
          <p className="text-sm text-white/80">
            {language === 'sw'
              ? '© 2025 Chamas. Haki zote zimehifadhiwa.'
              : '© 2025 Chamas. All rights reserved.'}
          </p>
          <p className="text-xs text-white/60">
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

