// ============================================================
// Browser Speech Adapter — Web Speech API Implementation
// ============================================================
// Uses SpeechRecognition (Chrome/Edge) for live microphone
// transcription. Continuous mode with interim results.

import type { VoiceInputAdapter } from './VoiceInputAdapter';
import type { TranscriptChunk, VoiceAdapterStatus } from '../types';

// Web Speech API types (not in all TS libs)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export class BrowserSpeechAdapter implements VoiceInputAdapter {
  private recognition: any = null;
  private status: VoiceAdapterStatus = 'idle';
  private transcriptCallback: ((chunk: TranscriptChunk) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private statusCallback: ((status: VoiceAdapterStatus) => void) | null = null;
  private shouldRestart = false;
  private restartTimeout: ReturnType<typeof setTimeout> | null = null;

  private lang: string;

  constructor(lang: string = 'en-US') {
    this.lang = lang;
    this.initRecognition();
  }

  private initRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.setStatus('error');
      this.errorCallback?.('Web Speech API is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (transcript.length > 0) {
          this.transcriptCallback?.({
            text: transcript,
            isFinal: result.isFinal,
            timestamp: Date.now(),
            source: 'microphone'
          });
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      const errorMap: Record<string, string> = {
        'no-speech': 'No speech detected. Please speak clearly.',
        'audio-capture': 'Microphone not found. Check hardware.',
        'not-allowed': 'Microphone access denied. Enable in browser settings.',
        'network': 'Network error during speech recognition.',
        'aborted': 'Speech recognition was aborted.'
      };

      const message = errorMap[event.error] || `Speech recognition error: ${event.error}`;

      // no-speech is recoverable — just restart
      if (event.error === 'no-speech' || event.error === 'aborted') {
        this.scheduleRestart();
        return;
      }

      this.setStatus('error');
      this.errorCallback?.(message);
    };

    this.recognition.onend = () => {
      // Auto-restart if we're supposed to be listening
      if (this.shouldRestart && this.status === 'listening') {
        this.scheduleRestart();
      } else {
        this.setStatus('idle');
      }
    };
  }

  private scheduleRestart(): void {
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.restartTimeout = setTimeout(() => {
      if (this.shouldRestart && this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // Already started, ignore
        }
      }
    }, 250);
  }

  private setStatus(status: VoiceAdapterStatus): void {
    this.status = status;
    this.statusCallback?.(status);
  }

  start(): void {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) return;
    }

    this.shouldRestart = true;
    this.setStatus('listening');

    try {
      this.recognition.start();
    } catch {
      // Already started
    }
  }

  stop(): void {
    this.shouldRestart = false;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Already stopped
      }
    }

    this.setStatus('idle');
  }

  onTranscript(callback: (chunk: TranscriptChunk) => void): void {
    this.transcriptCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  onStatusChange(callback: (status: VoiceAdapterStatus) => void): void {
    this.statusCallback = callback;
  }

  getStatus(): VoiceAdapterStatus {
    return this.status;
  }

  destroy(): void {
    this.stop();
    this.recognition = null;
    this.transcriptCallback = null;
    this.errorCallback = null;
    this.statusCallback = null;
  }
}
