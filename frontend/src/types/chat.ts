export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  error: string | null;
}

export interface VoiceProcessingResult {
  transcript: string;
  responseText: string;
  sessionId: string;
  intent: string | null;
  dialect: string | null;
  confidence: number | null;
  audioUrl: string;
}
