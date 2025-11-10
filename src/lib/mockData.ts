export interface Chama {
  id: string;
  name: string;
  nameSwahili: string;
  description: string;
  descriptionSwahili: string;
  contributionAmount: string;
  frequency: 'weekly' | 'monthly';
  members: number;
  maxMembers: number;
  totalSavings: string;
  contractAddress: string;
  nextPayout: Date;
  createdBy: string;
  status: 'active' | 'completed';
}

export interface Member {
  id: string;
  name: string;
  walletAddress: string;
  joinedAt: Date;
  totalContributions: string;
  hasReceivedPayout: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  language: 'sw' | 'en';
  timestamp: Date;
}

export const mockChamas: Chama[] = [
  {
    id: 'chama-1',
    name: 'Nairobi Women Empowerment',
    nameSwahili: 'Uwezeshaji wa Wanawake Nairobi',
    description: 'Supporting women entrepreneurs in Nairobi through collective savings',
    descriptionSwahili: 'Kusaidia wajasiriamali wa kike Nairobi kupitia akiba za pamoja',
    contributionAmount: '0.05',
    frequency: 'monthly',
    members: 12,
    maxMembers: 20,
    totalSavings: '0.6',
    contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    nextPayout: new Date('2025-12-01'),
    createdBy: '0x1234...5678',
    status: 'active',
  },
  {
    id: 'chama-2',
    name: 'Mombasa Youth Savings',
    nameSwahili: 'Akiba za Vijana Mombasa',
    description: 'Young professionals saving for business ventures and education',
    descriptionSwahili: 'Wataalamu vijana wakiokoa kwa ajili ya biashara na elimu',
    contributionAmount: '0.03',
    frequency: 'weekly',
    members: 8,
    maxMembers: 15,
    totalSavings: '0.96',
    contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    nextPayout: new Date('2025-11-25'),
    createdBy: '0xabcd...efgh',
    status: 'active',
  },
  {
    id: 'chama-3',
    name: 'Kisumu Farmers Cooperative',
    nameSwahili: 'Ushirika wa Wakulima Kisumu',
    description: 'Agricultural community pooling resources for equipment and seeds',
    descriptionSwahili: 'Jamii ya kilimo inayokusanya rasilimali kwa vifaa na mbegu',
    contributionAmount: '0.1',
    frequency: 'monthly',
    members: 25,
    maxMembers: 30,
    totalSavings: '2.5',
    contractAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    nextPayout: new Date('2025-12-15'),
    createdBy: '0x9876...5432',
    status: 'active',
  },
  {
    id: 'chama-4',
    name: 'Nakuru Tech Innovators',
    nameSwahili: 'Wavumbuzi wa Teknolojia Nakuru',
    description: 'Tech enthusiasts saving for startup capital and equipment',
    descriptionSwahili: 'Wapenda teknolojia wakiokoa kwa ajili ya mtaji wa kuanzisha na vifaa',
    contributionAmount: '0.08',
    frequency: 'monthly',
    members: 10,
    maxMembers: 12,
    totalSavings: '0.8',
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    nextPayout: new Date('2025-11-30'),
    createdBy: '0xdef0...1234',
    status: 'active',
  },
  {
    id: 'chama-5',
    name: 'Eldoret Market Traders',
    nameSwahili: 'Wafanyabiashara wa Soko Eldoret',
    description: 'Market vendors collaborating for bulk purchasing power',
    descriptionSwahili: 'Wauzaji wa soko wakishirikiana kwa nguvu ya ununuzi wa wingi',
    contributionAmount: '0.04',
    frequency: 'weekly',
    members: 15,
    maxMembers: 20,
    totalSavings: '2.4',
    contractAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    nextPayout: new Date('2025-11-28'),
    createdBy: '0x5678...9abc',
    status: 'active',
  },
];

export const mockMembers: Member[] = [
  {
    id: 'member-1',
    name: 'Amina Wanjiku',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    joinedAt: new Date('2025-01-15'),
    totalContributions: '0.5',
    hasReceivedPayout: false,
  },
  {
    id: 'member-2',
    name: 'Joseph Kimani',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    joinedAt: new Date('2025-02-01'),
    totalContributions: '0.4',
    hasReceivedPayout: false,
  },
  {
    id: 'member-3',
    name: 'Grace Achieng',
    walletAddress: '0x234567890abcdef1234567890abcdef123456789',
    joinedAt: new Date('2025-01-20'),
    totalContributions: '0.6',
    hasReceivedPayout: true,
  },
];

export const swahiliAIResponses: Record<string, string> = {
  // Greetings
  'habari': 'Habari yako! Mimi ni msaidizi wako wa Chamas. Ninaweza kukusaidia kuunda chama, kujiunge na chama, au kupata maelezo zaidi. Ungependa nini?',
  'jambo': 'Jambo! Karibu kwenye Chamas. Je, ungependa kuunda chama kipya au kujiunge na chama kilichopo?',
  'hello': 'Hello! Welcome to Chamas. I can help you create or join a savings group. What would you like to do?',
  
  // Chama creation
  'unda chama': 'Vizuri! Ili kuunda chama, nitahitaji maelezo yafuatayo:\n1. Jina la chama\n2. Kiasi cha mchango (kwa ETH)\n3. Mzunguko (kila wiki au kila mwezi)\n4. Idadi ya wanachama\n\nTafadhali niambie jina la chama unalotaka kuunda.',
  'create chama': 'Great! To create a chama, I need:\n1. Chama name\n2. Contribution amount (in ETH)\n3. Frequency (weekly or monthly)\n4. Number of members\n\nPlease tell me the name of your chama.',
  
  // Joining
  'jiunge': 'Nzuri! Kuna chamas 5 zinazofanya kazi. Ungependa kuona orodha ya chamas zilizopo?',
  'join': 'Great! There are 5 active chamas. Would you like to see the list of available chamas?',
  
  // Information
  'chama ni nini': 'Chama ni kikundi cha akiba ambacho watu wanakusanya fedha pamoja. Kila mwanachama anachangia kiasi kilichoamriwa, na fedha zinagawanywa kwa mzunguko. Ni njia ya kijamii ya kuokoa na kukopa.',
  'what is chama': 'A chama is a savings group where people pool money together. Each member contributes a set amount, and funds are distributed in rotation. It\'s a community-based way to save and borrow.',
  
  // Contributions
  'mchango': 'Mchango ni kiasi unachochangia kwa chama kila wiki au kila mwezi. Kiasi hiki kimewekwa wakati chama kilipoanzishwa. Ungependa kuona michango yako?',
  'contribution': 'A contribution is the amount you pay to the chama weekly or monthly. This amount was set when the chama was created. Would you like to see your contributions?',
  
  // Payouts
  'malipo': 'Malipo ni wakati unapokea fedha kutoka kwa chama. Kila mwanachama anapokea malipo kwa mzunguko. Ungependa kuona ratiba ya malipo?',
  'payout': 'A payout is when you receive money from the chama. Each member receives a payout in rotation. Would you like to see the payout schedule?',
  
  // Help
  'msaada': 'Ninaweza kukusaidia na:\n1. Kuunda chama kipya\n2. Kujiunge na chama\n3. Kuona chamas zilizopo\n4. Kuelewa jinsi chamas zinavyofanya kazi\n5. Kuangalia michango yako\n\nUngependa msaada gani?',
  'help': 'I can help you with:\n1. Creating a new chama\n2. Joining a chama\n3. Viewing available chamas\n4. Understanding how chamas work\n5. Checking your contributions\n\nWhat would you like help with?',
  
  // Default
  'default': 'Samahani, sijaelewa. Je, ungependa msaada? Weka "msaada" kuona vitu ninaweza kukusaidia navyo.',
  'default_en': 'Sorry, I didn\'t understand. Would you like help? Type "help" to see what I can assist you with.',
};

export const swahiliTranslations = {
  // Navigation
  'Home': 'Nyumbani',
  'Chamas': 'Chamas',
  'Dashboard': 'Dashibodi',
  'Create': 'Unda',
  
  // Actions
  'Connect Wallet': 'Unganisha Mkoba',
  'Disconnect': 'Tenganisha',
  'Join': 'Jiunge',
  'Create Chama': 'Unda Chama',
  'Contribute': 'Changia',
  'View Details': 'Ona Maelezo',
  
  // Labels
  'Name': 'Jina',
  'Description': 'Maelezo',
  'Contribution Amount': 'Kiasi cha Mchango',
  'Frequency': 'Mzunguko',
  'Members': 'Wanachama',
  'Total Savings': 'Jumla ya Akiba',
  'Next Payout': 'Malipo Yajayo',
  'Status': 'Hali',
  
  // Frequency
  'weekly': 'kila wiki',
  'monthly': 'kila mwezi',
  
  // Status
  'active': 'inafanya kazi',
  'completed': 'imekamilika',
  
  // Messages
  'Welcome to Chamas': 'Karibu kwenye Chamas',
  'Connect your wallet to get started': 'Unganisha mkoba wako kuanza',
  'No chamas found': 'Hakuna chamas zilizopatikana',
  'Successfully joined chama': 'Umefanikiwa kujiunge na chama',
  'Transaction pending': 'Muamala unasubiri',
  'Transaction confirmed': 'Muamala umethibitishwa',
  
  // Descriptions
  'Community savings powered by Ethereum': 'Akiba za jamii zinazotumia Ethereum',
  'Save together, grow together': 'Okoa pamoja, kua pamoja',
  'Transparent, secure, and accessible': 'Wazi, salama, na inayopatikana',
};

