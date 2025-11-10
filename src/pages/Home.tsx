import { ArrowRight, Shield, Users, Zap, Globe, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import WalletConnect from '@/components/WalletConnect';

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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {text.hero.title}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {text.hero.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <WalletConnect language={language} />
            <Link href="/chamas">
              <Button variant="outline" size="lg">
                {text.hero.viewChamas}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20 bg-white">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{text.features.title}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {text.features.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {text.features.items.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-20">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{text.howItWorks.title}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {text.howItWorks.steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
              {index < text.howItWorks.steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-primary/30" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-20 bg-green-50 rounded-3xl">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{text.stats.title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {text.stats.items.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
              <p className="text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="bg-gradient-primary text-white border-0">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-3xl md:text-4xl">{text.cta.title}</CardTitle>
            <CardDescription className="text-white/90 text-lg max-w-2xl mx-auto">
              {text.cta.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/create">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                {text.cta.button}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

