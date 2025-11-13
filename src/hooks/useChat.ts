import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { getAIResponse } from '@/lib/swahiliAI';

interface UseChatOptions {
  language: 'sw' | 'en';
  onError?: (error: Error) => void;
}

export function useChat({ language, onError }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: language === 'sw' 
        ? 'Habari! Mimi ni msaidizi wako wa Chamas. Ninaweza kukusaidia kuunda chama, kujiunge na chama, au kupata maelezo zaidi. Ungependa nini?'
        : 'Hello! I\'m your Chamas assistant. I can help you create a chama, join a chama, or learn more. What would you like to do?',
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const sendMessage = useCallback(async (text: string, isAssistant = false): Promise<void> => {
    if (!text.trim()) return;

    // If it's an assistant message, add it directly without processing
    if (isAssistant) {
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Try Supabase function first
      const { data, error } = await supabase.functions.invoke('swahili-chat', {
        body: { message: text }
      }).catch(() => ({ data: null, error: new Error('Supabase unavailable') }));

      if (!error && data?.message) {
        const aiMessage: ChatMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setBackendAvailable(true);
      } else {
        throw error || new Error('No response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setBackendAvailable(false);
      
      // Fallback to mock response
      const response = getAIResponse(text);
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [language, onError]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: language === 'sw' 
        ? 'Habari! Mimi ni msaidizi wako wa Chamas. Ninaweza kukusaidia kuunda chama, kujiunge na chama, au kupata maelezo zaidi. Ungependa nini?'
        : 'Hello! I\'m your Chamas assistant. I can help you create a chama, join a chama, or learn more. What would you like to do?',
      timestamp: new Date(),
    }]);
  }, [language]);

  return {
    messages,
    setMessages,
    isProcessing,
    backendAvailable,
    sendMessage,
    clearMessages,
  };
}
