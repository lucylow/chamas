import { useState, useRef, useCallback } from 'react';

interface UseVoiceRecordingOptions {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

export function useVoiceRecording({ onRecordingComplete, onError }: UseVoiceRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.stop();
    setIsRecording(false);
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
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

      recorder.onstop = () => {
        setIsRecording(false);
        const chunkCopy = [...chunksRef.current];
        chunksRef.current = [];
        
        if (chunkCopy.length > 0) {
          const audioBlob = new Blob(chunkCopy, { type: 'audio/webm' });
          onRecordingComplete(audioBlob);
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  }, [onRecordingComplete, onError]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    toggleRecording,
    stopRecording,
  };
}
