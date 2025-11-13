import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Mic, MicOff, X, Volume2, VolumeX, Loader2, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useChat } from '@/hooks/useChat';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { speak, stopSpeaking } from '@/lib/swahiliAI';
import { processVoiceSample } from '@/lib/voiceApi';
import { getAIResponse } from '@/lib/swahiliAI';
import type { ChatMessage } from '@/types/chat';

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

  const { messages, setMessages, isProcessing, backendAvailable, sendMessage } = useChat({ language });
  const { health, services, isHealthy } = useBackendHealth({ 
    pollInterval: 60000, // Check every minute
    enabled: isOpen, // Only poll when chatbot is open
  });

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

      // Add user message with transcript
      if (result.transcript) {
        const userMessage: ChatMessage = {
          role: 'user',
          content: result.transcript,
          timestamp: new Date(),
        };
        // Manually add to messages since sendMessage adds both user and assistant
        setMessages(prev => [...prev, userMessage]);
      }

      // Add AI response if available
      if (result.responseText) {
        // Send AI response as assistant message (bypass processing)
        await sendMessage(result.responseText, true);
      } else if (result.transcript) {
        // If no response text but we have transcript, use fallback
        const fallback = getAIResponse(result.transcript);
        await sendMessage(fallback.message, true);
      }

      // Play audio response
      if (result.audioUrl) {
        if (isSpeaking) {
          stopSpeaking();
        }
        const audio = new Audio(result.audioUrl);
        audio.addEventListener('ended', () => URL.revokeObjectURL(result.audioUrl));
        audio.addEventListener('error', () => URL.revokeObjectURL(result.audioUrl));
        audio.play().catch(err => console.warn('Audio playback failed', err));
      }
    } catch (err: unknown) {
      console.error('Voice processing failed:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      const statusCode = (err as any)?.statusCode;
      
      // Check if it's a service unavailable error
      if (statusCode === 503 || errorMessage.includes('503') || errorMessage.includes('not ready')) {
        // Service unavailable - use fallback but still add user transcript if available
        if (input.trim()) {
          // If we have text input, use that
          const fallback = getAIResponse(input);
          await sendMessage(fallback.message, true);
        } else {
          // Otherwise show helpful message
          const fallback = getAIResponse(
            language === 'sw' 
              ? 'Huduma ya sauti haipatikani kwa sasa. Tafadhali tumia maandishi au jaribu tena baadaye.'
              : 'Voice service is currently unavailable. Please use text input or try again later.'
          );
          await sendMessage(fallback.message, true);
        }
      } else if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
        // Network error - backend might be down
        const fallback = getAIResponse(
          language === 'sw'
            ? 'Haijawezekana kuunganisha na huduma. Tafadhali hakikisha kuwa server iko juu na jaribu tena.'
            : 'Unable to connect to service. Please ensure the server is running and try again.'
        );
        await sendMessage(fallback.message, true);
      } else {
        // Generic error - use fallback
        const fallback = getAIResponse(
          language === 'sw'
            ? 'Samahani, kulikuwa na tatizo na sauti yako. Tafadhali jaribu tena au tumia maandishi.'
            : 'Sorry, there was a problem with your voice input. Please try again or use text.'
        );
        await sendMessage(fallback.message, true);
      }
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const { isRecording, toggleRecording } = useVoiceRecording({
    onRecordingComplete: handleVoiceComplete,
    onError: (_error) => {
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
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] h-[calc(100vh-8rem)] sm:h-[600px] max-h-[calc(100vh-8rem)] sm:max-h-[calc(100vh-3rem)] shadow-2xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4 border-b px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          {text.title}
        </CardTitle>
        <div className="flex items-center gap-1 sm:gap-2">
          <Badge
            variant="outline"
            className="cursor-pointer text-xs"
            onClick={() => onLanguageChange(language === 'sw' ? 'en' : 'sw')}
          >
            {language === 'sw' ? '🇰🇪 SW' : '🇬🇧 EN'}
          </Badge>
          {canRecordVoice && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleSpeech}
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              {isSpeaking ? (
                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              ) : (
                <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <p className="text-[10px] sm:text-xs opacity-70 mt-0.5 sm:mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-3 sm:p-4 border-t">
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={text.placeholder}
            className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
          />
          {canRecordVoice && (
            <Button
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              onClick={toggleRecording}
              className={`${isRecording ? 'recording-indicator animate-pulse' : ''} h-9 w-9 sm:h-10 sm:w-10`}
              disabled={isProcessing || isProcessingVoice}
            >
              {isRecording ? <MicOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Mic className="h-3 w-3 sm:h-4 sm:w-4" />}
            </Button>
          )}
          <Button size="icon" onClick={() => handleSend()} className="h-9 w-9 sm:h-10 sm:w-10">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
        {isRecording && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 text-center animate-pulse">
            {text.recording}
          </p>
        )}
        {(isProcessing || isProcessingVoice) && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            {language === 'sw' ? 'Inachakata...' : 'Processing...'}
          </div>
        )}
        {(!backendAvailable || !isHealthy) && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400 mt-1.5 sm:mt-2">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="break-words">
              {language === 'sw'
                ? 'Baadhi ya huduma hazipatikani. Maandishi bado yanafanya kazi.'
                : 'Some services unavailable. Text features still work.'}
            </span>
          </div>
        )}
        {health && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
            {services.asr && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                <CheckCircle2 className="h-2 w-2 mr-0.5" />
                ASR
              </Badge>
            )}
            {services.llm && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                <CheckCircle2 className="h-2 w-2 mr-0.5" />
                LLM
              </Badge>
            )}
            {services.tts && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                <CheckCircle2 className="h-2 w-2 mr-0.5" />
                TTS
              </Badge>
            )}
            {services.chama && (
              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                <CheckCircle2 className="h-2 w-2 mr-0.5" />
                Chama
              </Badge>
            )}
          </div>
        )}
        {(voiceMetrics.intent || voiceMetrics.dialect || voiceMetrics.latencyMs) && (
          <div className="mt-2 sm:mt-3 rounded-md bg-muted px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] leading-3 sm:leading-4 text-muted-foreground space-y-0.5 sm:space-y-1">
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

