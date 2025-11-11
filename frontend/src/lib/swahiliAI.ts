import { AIMessage, swahiliAIResponses } from './mockData';

export interface AIResponse {
  message: string;
  language: 'sw' | 'en';
  suggestions?: string[];
}

// Detect language from input
export function detectLanguage(text: string): 'sw' | 'en' {
  const swahiliKeywords = [
    'habari', 'jambo', 'asante', 'karibu', 'ndiyo', 'hapana',
    'chama', 'mchango', 'malipo', 'akiba', 'fedha', 'jiunge',
    'unda', 'wanachama', 'mkutano', 'msaada', 'tafadhali',
    'sawa', 'vizuri', 'nzuri', 'pole', 'samahani'
  ];
  
  const lowerText = text.toLowerCase();
  const hasSwahili = swahiliKeywords.some(keyword => lowerText.includes(keyword));
  
  return hasSwahili ? 'sw' : 'en';
}

// Get AI response based on user input
export function getAIResponse(userInput: string): AIResponse {
  const language = detectLanguage(userInput);
  const lowerInput = userInput.toLowerCase().trim();
  
  // Check for exact matches first
  for (const [key, response] of Object.entries(swahiliAIResponses)) {
    if (lowerInput.includes(key.toLowerCase())) {
      return {
        message: response,
        language: key.includes('_en') ? 'en' : language,
        suggestions: getSuggestions(key, language),
      };
    }
  }
  
  // Default response
  const defaultKey = language === 'sw' ? 'default' : 'default_en';
  return {
    message: swahiliAIResponses[defaultKey],
    language,
    suggestions: getDefaultSuggestions(language),
  };
}

// Get contextual suggestions
function getSuggestions(context: string, language: 'sw' | 'en'): string[] {
  if (language === 'sw') {
    switch (context) {
      case 'habari':
      case 'jambo':
        return ['Unda chama', 'Jiunge na chama', 'Ona chamas', 'Msaada'];
      case 'unda chama':
        return ['Jina la chama', 'Kiasi cha mchango', 'Mzunguko'];
      case 'jiunge':
        return ['Ona chamas zilizopo', 'Tafuta chama'];
      default:
        return ['Msaada', 'Unda chama', 'Jiunge'];
    }
  } else {
    switch (context) {
      case 'hello':
        return ['Create chama', 'Join chama', 'View chamas', 'Help'];
      case 'create chama':
        return ['Chama name', 'Contribution amount', 'Frequency'];
      case 'join':
        return ['View available chamas', 'Search chama'];
      default:
        return ['Help', 'Create chama', 'Join'];
    }
  }
}

function getDefaultSuggestions(language: 'sw' | 'en'): string[] {
  return language === 'sw'
    ? ['Msaada', 'Unda chama', 'Jiunge na chama', 'Chama ni nini?']
    : ['Help', 'Create chama', 'Join chama', 'What is a chama?'];
}

// Translate common phrases
export function translate(text: string, targetLang: 'sw' | 'en'): string {
  const translations: Record<string, { sw: string; en: string }> = {
    'Connect Wallet': { sw: 'Unganisha Mkoba', en: 'Connect Wallet' },
    'Create Chama': { sw: 'Unda Chama', en: 'Create Chama' },
    'Join Chama': { sw: 'Jiunge na Chama', en: 'Join Chama' },
    'My Chamas': { sw: 'Chamas Zangu', en: 'My Chamas' },
    'Dashboard': { sw: 'Dashibodi', en: 'Dashboard' },
    'Home': { sw: 'Nyumbani', en: 'Home' },
    'Members': { sw: 'Wanachama', en: 'Members' },
    'Contribution': { sw: 'Mchango', en: 'Contribution' },
    'Payout': { sw: 'Malipo', en: 'Payout' },
    'Total Savings': { sw: 'Jumla ya Akiba', en: 'Total Savings' },
    'Active': { sw: 'Inafanya Kazi', en: 'Active' },
    'Completed': { sw: 'Imekamilika', en: 'Completed' },
    'Weekly': { sw: 'Kila Wiki', en: 'Weekly' },
    'Monthly': { sw: 'Kila Mwezi', en: 'Monthly' },
  };
  
  const entry = translations[text];
  return entry ? entry[targetLang] : text;
}

// Mock OpenAI-style API call (for demo)
export async function callSwahiliLLM(
  messages: AIMessage[],
  systemPrompt?: string
): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return 'Samahani, sikuelewa. Tafadhali jaribu tena.';
  }
  
  const response = getAIResponse(lastMessage.content);
  return response.message;
}

// Voice recognition setup (Web Speech API)
export function setupVoiceRecognition(
  onResult: (transcript: string, language: 'sw' | 'en') => void,
  onError: (error: string) => void
): SpeechRecognition | null {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    onError('Voice recognition is not supported in this browser');
    return null;
  }
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'sw-KE'; // Swahili (Kenya)
  
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    const language = detectLanguage(transcript);
    onResult(transcript, language);
  };
  
  recognition.onerror = (event: any) => {
    onError(`Voice recognition error: ${event.error}`);
  };
  
  return recognition;
}

// Text-to-speech (Web Speech API)
export function speak(text: string, language: 'sw' | 'en' = 'sw'): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Text-to-speech is not supported in this browser');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language === 'sw' ? 'sw-KE' : 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1.0;
  
  window.speechSynthesis.speak(utterance);
}

// Stop speaking
export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Check if voice features are supported
export function isVoiceSupported(): boolean {
  return (
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
    'speechSynthesis' in window
  );
}

