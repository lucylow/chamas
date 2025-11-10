import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Mic, MicOff, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AIMessage } from '@/lib/mockData';
import { getAIResponse, setupVoiceRecognition, speak, stopSpeaking, isVoiceSupported } from '@/lib/swahiliAI';

interface SwahiliChatbotProps {
  language: 'sw' | 'en';
  onLanguageChange: (lang: 'sw' | 'en') => void;
}

export default function SwahiliChatbot({ language, onLanguageChange }: SwahiliChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: 'assistant',
      content: language === 'sw' 
        ? 'Habari! Mimi ni msaidizi wako wa Chamas. Ninaweza kukusaidia kuunda chama, kujiunge na chama, au kupata maelezo zaidi. Ungependa nini?'
        : 'Hello! I\'m your Chamas assistant. I can help you create a chama, join a chama, or learn more. What would you like to do?',
      language,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVoiceSupported()) {
      const rec = setupVoiceRecognition(
        (transcript, detectedLang) => {
          setInput(transcript);
          setIsRecording(false);
          // Auto-send voice input
          handleSend(transcript);
        },
        (error) => {
          console.error('Voice error:', error);
          setIsRecording(false);
        }
      );
      setRecognition(rec);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleSend(text?: string) {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: AIMessage = {
      role: 'user',
      content: messageText,
      language,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Get AI response
    setTimeout(() => {
      const response = getAIResponse(messageText);
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: response.message,
        language: response.language,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-speak response if enabled
      if (isSpeaking) {
        speak(response.message, response.language);
      }
    }, 500);
  }

  function handleVoiceInput() {
    if (!recognition) {
      alert(language === 'sw' 
        ? 'Sauti haijaunganishwa kwenye kivinjari hiki'
        : 'Voice input is not supported in this browser'
      );
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  }

  function toggleSpeech() {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
    }
  }

  const text = {
    title: language === 'sw' ? 'Msaidizi wa Chamas' : 'Chamas Assistant',
    placeholder: language === 'sw' ? 'Andika ujumbe...' : 'Type a message...',
    voiceHint: language === 'sw' ? 'Bonyeza kuzungumza' : 'Click to speak',
    recording: language === 'sw' ? 'Inasikiliza...' : 'Listening...',
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-3rem)] shadow-2xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          {text.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer"
            onClick={() => onLanguageChange(language === 'sw' ? 'en' : 'sw')}
          >
            {language === 'sw' ? '🇰🇪 SW' : '🇬🇧 EN'}
          </Badge>
          {isVoiceSupported() && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleSpeech}
              className="h-8 w-8"
            >
              {isSpeaking ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={text.placeholder}
            className="flex-1"
          />
          {isVoiceSupported() && (
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={handleVoiceInput}
              className={isRecording ? 'recording-indicator' : ''}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <Button size="icon" onClick={() => handleSend()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isRecording && (
          <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
            {text.recording}
          </p>
        )}
      </div>
    </Card>
  );
}

