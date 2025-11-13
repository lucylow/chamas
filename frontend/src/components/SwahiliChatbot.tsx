import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Mic, MicOff, X, Volume2, VolumeX, Loader2, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useChat } from '@/hooks/useChat';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { speak, stopSpeaking } from '@/lib/swahiliAI';
import { processVoiceSample } from '@/lib/voiceApi';
import { getAIResponse } from '@/lib/swahiliAI';
import { ChatMessage } from '@/types/chat';

interface SwahiliChatbotProps {
  language: 'sw' | 'en';
  onLanguageChange: (lang: 'sw' | 'en') => void;
}

export default function SwahiliChatbot({ language, onLanguageChange }: SwahiliChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceMetrics, setVoiceMetrics] = useState({
    intent: null as string | null,
    dialect: null as string | null,
    confidence: null as number | null,
    latencyMs: null as number | null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isProcessing, backendAvailable, sendMessage } = useChat({ language });

  const handleVoiceComplete = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    const startTime = performance.now();

    try {
      const result = await processVoiceSample(audioBlob, sessionId ?? undefined, language);
      
      setSessionId(result.sessionId);
      setVoiceMetrics({
        intent: result.intent,
        dialect: result.dialect,
        confidence: result.confidence,
        latencyMs: Math.round(performance.now() - startTime),
      });

      // Play audio response
      if (isSpeaking) {
        stopSpeaking();
      }
      const audio = new Audio(result.audioUrl);
      audio.addEventListener('ended', () => URL.revokeObjectURL(result.audioUrl));
      audio.addEventListener('error', () => URL.revokeObjectURL(result.audioUrl));
      audio.play().catch(err => console.warn('Audio playback failed', err));
      
      // Send transcript as message
      await sendMessage(result.transcript || (language === 'sw' ? 'Sauti yako imepokelewa.' : 'Your voice input was received.'));
    } catch (error) {
      console.error('Voice processing failed:', error);
      const fallback = getAIResponse(input || '');
      await sendMessage(fallback.message);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const { isRecording, toggleRecording } = useVoiceRecording({
    onRecordingComplete: handleVoiceComplete,
    onError: (error) => {
      alert(
        language === 'sw'
          ? 'Tafadhali ruhusu ufikiaji wa kipaza sauti kwenye kivinjari.'
          : 'Please allow microphone access in your browser.'
      );
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    setInput('');
    await sendMessage(messageText);

    // Auto-speak if enabled
    if (isSpeaking && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speak(lastMessage.content, language);
      }
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
    }
  };

  const text = {
    title: language === 'sw' ? 'Msaidizi wa Chamas' : 'Chamas Assistant',
    placeholder: language === 'sw' ? 'Andika ujumbe...' : 'Type a message...',
    recording: language === 'sw' ? 'Inasikiliza...' : 'Listening...',
  };

  const canRecordVoice = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

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
              onClick={toggleRecording}
              className={isRecording ? 'recording-indicator animate-pulse' : ''}
              disabled={isProcessing || isProcessingVoice}
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
        {(isProcessing || isProcessingVoice) && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {language === 'sw' ? 'Inachakata...' : 'Processing...'}
          </div>
        )}
        {!backendAvailable && (
          <div className="flex items-center justify-center gap-2 text-xs text-destructive mt-2">
            <WifiOff className="h-4 w-4" />
            {language === 'sw'
              ? 'Huduma haipatikani. Tumerejea kwenye maandishi.'
              : 'Service unavailable. Falling back to text.'}
          </div>
        )}
        {(voiceMetrics.intent || voiceMetrics.dialect || voiceMetrics.latencyMs) && (
          <div className="mt-3 rounded-md bg-muted px-3 py-2 text-[11px] leading-4 text-muted-foreground space-y-1">
            {voiceMetrics.latencyMs !== null && (
              <p>
                {language === 'sw' ? 'Muda wa majibu:' : 'Latency:'} {voiceMetrics.latencyMs}ms
              </p>
            )}
            {voiceMetrics.intent && (
              <p>
                {language === 'sw' ? 'Nia iliyogunduliwa:' : 'Detected intent:'} {voiceMetrics.intent}
              </p>
            )}
            {voiceMetrics.dialect && (
              <p>
                {language === 'sw' ? 'Lahaja:' : 'Dialect:'} {voiceMetrics.dialect}
                {voiceMetrics.confidence !== null && ` · ${(voiceMetrics.confidence * 100).toFixed(0)}%`}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

