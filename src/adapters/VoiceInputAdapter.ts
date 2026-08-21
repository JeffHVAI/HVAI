// ============================================================
// Voice Input Adapter — Interface
// ============================================================
// All voice input sources (browser mic, WebSocket, demo playback)
// implement this interface so the NLP engine receives transcript
// chunks through a single uniform channel.

import type { TranscriptChunk, VoiceAdapterStatus } from '../types';

export interface VoiceInputAdapter {
  /** Start capturing voice input. */
  start(): void;

  /** Stop capturing voice input. */
  stop(): void;

  /** Register a callback for incoming transcript chunks. */
  onTranscript(callback: (chunk: TranscriptChunk) => void): void;

  /** Register a callback for errors. */
  onError(callback: (error: string) => void): void;

  /** Register a callback for status changes. */
  onStatusChange(callback: (status: VoiceAdapterStatus) => void): void;

  /** Get the current adapter status. */
  getStatus(): VoiceAdapterStatus;

  /** Dispose resources. */
  destroy(): void;
}
