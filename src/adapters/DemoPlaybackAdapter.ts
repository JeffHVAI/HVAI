// ============================================================
// Demo Playback Adapter — Scripted Timeline
// ============================================================
// Wraps the existing dialogueLines + audio timeline, emitting
// them as TranscriptChunk events through the VoiceInputAdapter
// interface so the NLP engine processes them identically to
// live voice input.

import type { VoiceInputAdapter } from './VoiceInputAdapter';
import type { TranscriptChunk, VoiceAdapterStatus, DialogueLine } from '../types';

export class DemoPlaybackAdapter implements VoiceInputAdapter {
  private status: VoiceAdapterStatus = 'idle';
  private transcriptCallback: ((chunk: TranscriptChunk) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private statusCallback: ((status: VoiceAdapterStatus) => void) | null = null;
  private emittedLines = new Set<number>();
  private currentTime = 0;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private dialogueLines: DialogueLine[];
  private getAudioTime: () => number;

  constructor(
    dialogueLines: DialogueLine[],
    getAudioTime: () => number
  ) {
    this.dialogueLines = dialogueLines;
    this.getAudioTime = getAudioTime;
  }

  start(): void {
    this.setStatus('listening');
    this.emittedLines.clear();

    // Poll current audio time and emit lines that become active
    this.pollInterval = setInterval(() => {
      this.currentTime = this.getAudioTime();
      this.checkAndEmitLines();
    }, 200);
  }

  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.setStatus('idle');
  }

  /** Call this externally when scrubbing backward to re-enable emission. */
  resetToTime(time: number): void {
    // Remove any emitted lines that are after the new time
    this.emittedLines.forEach(idx => {
      if (this.dialogueLines[idx].start > time) {
        this.emittedLines.delete(idx);
      }
    });
  }

  private checkAndEmitLines(): void {
    if (this.dialogueLines.length === 0) {
      this.errorCallback?.('No dialogue lines configured.');
      return;
    }

    for (let i = 0; i < this.dialogueLines.length; i++) {
      const line = this.dialogueLines[i];

      // Emit when we're within the line's time window and haven't emitted it yet
      if (
        this.currentTime >= line.start &&
        this.currentTime <= line.end + 0.5 &&
        !this.emittedLines.has(i)
      ) {
        this.emittedLines.add(i);

        // Strip the speaker prefix from the text for NLP processing
        const cleanText = line.text
          .replace(/^(Dr\.\s*Patel:|Jane Doe:|System:|DAX Copilot:)\s*/i, '')
          .trim();

        if (cleanText.length > 0) {
          this.transcriptCallback?.({
            text: cleanText,
            isFinal: true,
            timestamp: Date.now(),
            source: 'demo'
          });
        }
      }
    }
  }

  private setStatus(status: VoiceAdapterStatus): void {
    this.status = status;
    this.statusCallback?.(status);
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
    this.transcriptCallback = null;
    this.errorCallback = null;
    this.statusCallback = null;
  }
}
