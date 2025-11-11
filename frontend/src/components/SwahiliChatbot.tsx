import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Mic, MicOff, X, Volume2, VolumeX, Loader2, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AIMessage } from '@/lib/mockData';
import { getAIResponse, speak, stopSpeaking } from '@/lib/swahiliAI';
import { processVoiceSample } from '@/lib/voiceApi';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<string | null>(null);
  const [lastDialect, setLastDialect] = useState<string | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

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

  const canRecordVoice = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
    mediaRecorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleVoiceInput = useCallback(async () => {
    if (!canRecordVoice) {
      alert(
        language === 'sw'
          ? 'Kivinjari hiki hakina ufikiaji wa kipaza sauti.'
          : 'This browser does not support microphone recording.'
      );
      return;
    }

    if (isRecording) {
      await stopRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];
        setIsProcessing(true);
        const startedAt = performance.now();

        try {
          const result = await processVoiceSample(audioBlob, sessionId ?? undefined);
          const userTranscript = result.transcript || (language === 'sw' ? 'Sauti yako imepokelewa.' : 'Your voice input was received.');

          const userMessage: AIMessage = {
            role: 'user',
            content: userTranscript,
            language,
            timestamp: new Date(),
          };

          const aiMessage: AIMessage = {
            role: 'assistant',
            content: result.responseText || (language === 'sw' ? 'Samahani, sijapata jibu sasa.' : 'Sorry, I could not respond right now.'),
            language,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, userMessage, aiMessage]);
          setSessionId(result.sessionId);
          setLastIntent(result.intent);
          setLastDialect(result.dialect);
          setLastConfidence(result.confidence);
          setLatencyMs(Math.round(performance.now() - startedAt));
          setBackendAvailable(true);

          if (isSpeaking) {
            stopSpeaking();
          }
          const audio = new Audio(result.audioUrl);
          audio.play().catch(err => console.warn('Audio playback failed', err));
        } catch (error) {
          console.error('Voice processing failed:', error);
          setBackendAvailable(false);
          const warningMessage: AIMessage = {
            role: 'assistant',
            content: language === 'sw'
              ? 'Kuna hitilafu kwenye huduma ya sauti. Nitaendelea kwa maandishi.'
              : 'There was an error with the voice service. I will continue in text.',
            language,
            timestamp: new Date(),
          };
          const fallback = getAIResponse(input || '');
          const aiMessage: AIMessage = {
            role: 'assistant',
            content: fallback.message || (language === 'sw' ? 'Samahani, jaribu tena baadaye.' : 'Sorry, please try again later.'),
            language: fallback.language,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, warningMessage, aiMessage]);
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert(
        language === 'sw'
          ? 'Tafadhali ruhusu ufikiaji wa kipaza sauti kwenye kivinjari.'
          : 'Please allow microphone access in your browser.'
      );
    }
  }, [canRecordVoice, input, isRecording, isSpeaking, language, sessionId, stopRecording]);

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
          {canRecordVoice && (
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
          {canRecordVoice && (
            <Button
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={() => handleVoiceInput()}
              className={isRecording ? 'recording-indicator animate-pulse' : ''}
              disabled={isProcessing}
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
        {isProcessing && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {language === 'sw' ? 'Inachakata sauti...' : 'Processing voice...'}
          </div>
        )}
        {!backendAvailable && (
          <div className="flex items-center justify-center gap-2 text-xs text-destructive mt-2">
            <WifiOff className="h-4 w-4" />
            {language === 'sw'
              ? 'Huduma ya sauti haipatikani kwa sasa. Tumerejea kwenye maandishi.'
              : 'Voice service unavailable. Falling back to text.'}
          </div>
        )}
        {(lastIntent || lastDialect || latencyMs) && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2 text-[11px] leading-4 text-muted-foreground space-y-1">
            {latencyMs !== null && (
              <p>
                {language === 'sw' ? 'Muda wa majibu:' : 'Latency:'} {latencyMs}ms
              </p>
            )}
            {lastIntent && (
              <p>
                {language === 'sw' ? 'Nia iliyogunduliwa:' : 'Detected intent:'} {lastIntent}
              </p>
            )}
            {lastDialect && (
              <p>
                {language === 'sw' ? 'Lahaja:' : 'Dialect:'} {lastDialect}
                {lastConfidence !== null && ` · ${(lastConfidence * 100).toFixed(0)}%`}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

