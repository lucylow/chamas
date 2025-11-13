import { nanoid } from 'nanoid';

export interface VoiceProcessResult {
  audioUrl: string;
  intent: string;
  dialect: string;
  sessionId: string;
  confidence: number;
  responseText: string;
  transcript: string;
}

const DEFAULT_API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function processVoiceSample(
  blob: Blob,
  sessionId?: string,
  language: 'sw' | 'en' = 'sw'
): Promise<VoiceProcessResult> {
  const form = new FormData();
  const extension = blob.type.includes('webm')
    ? 'webm'
    : blob.type.includes('ogg')
      ? 'ogg'
      : 'wav';
  form.append('file', blob, `voice-${Date.now()}.${extension}`);
  if (sessionId) {
    form.append('session_id', sessionId);
  }
  form.append('language', language);

  const response = await fetch(`${DEFAULT_API}/voice/process`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Voice pipeline failed: ${response.status} ${errorText}`);
  }

  const headers = response.headers;
  const newSession = headers.get('X-Session-ID') ?? sessionId ?? nanoid();
  const intent = headers.get('X-Intent') ?? 'general_query';
  const dialect = headers.get('X-Dialect') ?? 'kiswahili_sanifu';
  const confidence = Number.parseFloat(headers.get('X-Confidence') ?? '0.6');
  const responseTextHeader = headers.get('X-Response-Text') ?? '';
  const transcriptHeader = headers.get('X-Transcript') ?? '';
  const responseText = responseTextHeader ? decodeURIComponent(responseTextHeader) : '';
  const transcript = transcriptHeader ? decodeURIComponent(transcriptHeader) : '';

  const buffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') ?? 'audio/mpeg';
  const audioBlob = new Blob([buffer], { type: mimeType });
  const audioUrl = URL.createObjectURL(audioBlob);

  return {
    audioUrl,
    intent,
    dialect,
    sessionId: newSession,
    confidence: Number.isFinite(confidence) ? confidence : 0.6,
    responseText,
    transcript,
  };
}

