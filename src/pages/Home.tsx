import { ArrowRight, Shield, Users, Zap, Globe, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WalletConnect from '@/components/WalletConnect';
import BackendStatus from '@/components/BackendStatus';

interface HomeProps {
  language: 'sw' | 'en';
}

export default function Home({ language }: HomeProps) {
  const text = {
    hero: {
      title: language === 'sw' 
        ? 'Akiba ya Jamii Inayotumia Ethereum'
        : 'Community Savings Powered by Ethereum',
      subtitle: language === 'sw'
        ? 'Okoa pamoja, kua pamoja. Chamas zinazotumia blockchain kwa uwazi, usalama, na upatikanaji.'
        : 'Save together, grow together. Blockchain-powered chamas for transparency, security, and accessibility.',
      cta: language === 'sw' ? 'Anza Sasa' : 'Get Started',
      viewChamas: language === 'sw' ? 'Ona Chamas' : 'View Chamas',
    },
    features: {
      title: language === 'sw' ? 'Kwa Nini Chamas?' : 'Why Chamas?',
      subtitle: language === 'sw'
        ? 'Njia ya kijamii ya kuokoa na kukopa, sasa kwenye blockchain'
        : 'A community-based way to save and borrow, now on blockchain',
      items: [
        {
          icon: Shield,
          title: language === 'sw' ? 'Salama na Wazi' : 'Secure & Transparent',
          description: language === 'sw'
            ? 'Miamala yote kwenye Ethereum blockchain. Hakuna siri, hakuna wasiwasi.'
            : 'All transactions on Ethereum blockchain. No secrets, no worries.',
        },
        {
          icon: Users,
          title: language === 'sw' ? 'Jamii ya Kweli' : 'True Community',
          description: language === 'sw'
            ? 'Jiunge na vikundi vya akiba vya watu wanaofanana nawe. Okoa pamoja, fanikiwa pamoja.'
            : 'Join savings groups with like-minded people. Save together, succeed together.',
        },
        {
          icon: Zap,
          title: language === 'sw' ? 'Haraka na Rahisi' : 'Fast & Easy',
          description: language === 'sw'
            ? 'Unda au jiunge na chama kwa dakika. Changia na upokee malipo kiotomatiki.'
            : 'Create or join a chama in minutes. Contribute and receive payouts automatically.',
        },
        {
          icon: Globe,
          title: language === 'sw' ? 'Upatikanaji wa Kimataifa' : 'Global Access',
          description: language === 'sw'
            ? 'Fikia chamas kutoka popote duniani. Hakuna mipaka, hakuna vizuizi.'
            : 'Access chamas from anywhere in the world. No borders, no barriers.',
        },
        {
          icon: Sparkles,
          title: language === 'sw' ? 'Msaidizi wa A.I.' : 'AI Assistant',
          description: language === 'sw'
            ? 'Pata msaada kwa Kiswahili au Kiingereza. Msaidizi wetu wa A.I. yuko hapa kukusaidia.'
            : 'Get help in Swahili or English. Our AI assistant is here to guide you.',
        },
      ],
    },
    howItWorks: {
      title: language === 'sw' ? 'Jinsi Inavyofanya Kazi' : 'How It Works',
      steps: [
        {
          number: '1',
          title: language === 'sw' ? 'Unganisha Mkoba' : 'Connect Wallet',
          description: language === 'sw'
            ? 'Unganisha mkoba wako wa MetaMask ili kuanza'
            : 'Connect your MetaMask wallet to get started',
        },
        {
          number: '2',
          title: language === 'sw' ? 'Jiunge au Unda Chama' : 'Join or Create a Chama',
          description: language === 'sw'
            ? 'Chagua chama kilichopo au unda kipya'
            : 'Choose an existing chama or create a new one',
        },
        {
          number: '3',
          title: language === 'sw' ? 'Changia Mara kwa Mara' : 'Contribute Regularly',
          description: language === 'sw'
            ? 'Changia kiasi kilichoamriwa kila wiki au kila mwezi'
            : 'Contribute the agreed amount weekly or monthly',
        },
        {
          number: '4',
          title: language === 'sw' ? 'Pokea Malipo' : 'Receive Payouts',
          description: language === 'sw'
            ? 'Pokea malipo yako kwa mzunguko, kiotomatiki'
            : 'Receive your payout in rotation, automatically',
        },
      ],
    },
    stats: {
      title: language === 'sw' ? 'Chamas kwa Nambari' : 'Chamas by Numbers',
      items: [
        { value: '5+', label: language === 'sw' ? 'Chamas Zinazofanya Kazi' : 'Active Chamas' },
        { value: '70+', label: language === 'sw' ? 'Wanachama' : 'Members' },
        { value: '7.26', label: language === 'sw' ? 'ETH Jumla ya Akiba' : 'ETH Total Savings' },
        { value: '100%', label: language === 'sw' ? 'Kwenye Blockchain' : 'On Blockchain' },
      ],
    },
    cta: {
      title: language === 'sw' ? 'Tayari Kuanza?' : 'Ready to Start?',
      description: language === 'sw'
        ? 'Jiunge na jamii ya watu wanaookoa pamoja na kufanikiwa pamoja.'
        : 'Join a community of people saving together and succeeding together.',
      button: language === 'sw' ? 'Unda Chama Yako' : 'Create Your Chama',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Hero Section with Pattern */}
      <section className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-32 pattern-bg">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gradient animate-fade-in leading-tight">
            {text.hero.title}
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto animate-fade-in px-2">
            {text.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <WalletConnect language={language} />
            <Link href="/chamas">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-sm sm:text-base">
                {text.hero.viewChamas}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {/* Backend Status */}
          <div className="max-w-md mx-auto mt-6 sm:mt-8">
            <BackendStatus language={language} compact={true} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient">{text.features.title}</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            {text.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {text.features.items.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all hover-lift shadow-md hover:shadow-glow">
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full gradient-primary flex items-center justify-center mb-3 sm:mb-4 shadow-glow">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <CardDescription className="text-sm sm:text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient">{text.howItWorks.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {text.howItWorks.steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full gradient-hero text-white flex items-center justify-center text-xl sm:text-2xl font-bold shadow-glow pulse-ring">
                    {step.number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
                </div>
                {index < text.howItWorks.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 sm:top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-secondary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="gradient-hero rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-white shadow-xl">
          <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{text.stats.title}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {text.stats.items.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl sm:text-4xl md:text-5xl font-bold">{stat.value}</p>
                <p className="text-white/80 mt-1 sm:mt-2 font-medium text-xs sm:text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <Card className="gradient-primary text-white border-0 shadow-glow hover-lift">
          <CardHeader className="text-center space-y-3 sm:space-y-4 pb-6 sm:pb-8 px-4 sm:px-6 pt-6 sm:pt-8">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl">{text.cta.title}</CardTitle>
            <CardDescription className="text-white/90 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              {text.cta.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center px-4 sm:px-6 pb-6 sm:pb-8">
            <Link href="/create">
              <Button size="lg" variant="secondary" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 hover:scale-105 transition-transform shadow-lg w-full sm:w-auto">
                {text.cta.button}
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

