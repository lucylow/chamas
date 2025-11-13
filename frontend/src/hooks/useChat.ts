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

  const sendMessage = useCallback(async (text: string): Promise<void> => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('swahili-chat', {
        body: { message: text }
      });

      if (error) throw error;

      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: data.message || (language === 'sw' ? 'Samahani, sijaweza kupata jibu.' : 'Sorry, I could not respond.'),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setBackendAvailable(true);
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
    isProcessing,
    backendAvailable,
    sendMessage,
    clearMessages,
  };
}
