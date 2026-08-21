// ============================================================
// WebSocket Adapter — Hover OS Production Channel
// ============================================================
// Connects to a Hover OS WebSocket endpoint to receive
// transcribed speech as JSON messages.

import type { VoiceInputAdapter } from './VoiceInputAdapter';
import type { TranscriptChunk, VoiceAdapterStatus } from '../types';

interface HoverOSMessage {
  type: 'TRANSCRIPT' | 'STATUS' | 'HEARTBEAT';
  text?: string;
  isFinal?: boolean;
  timestamp?: number;
}

export class WebSocketAdapter implements VoiceInputAdapter {
  private ws: WebSocket | null = null;
  private status: VoiceAdapterStatus = 'idle';
  private transcriptCallback: ((chunk: TranscriptChunk) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private statusCallback: ((status: VoiceAdapterStatus) => void) | null = null;
  private shouldReconnect = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  private url: string;

  constructor(url: string = 'ws://localhost:8765') {
    this.url = url;
  }

  private connect(): void {
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('listening');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: HoverOSMessage = JSON.parse(event.data);

          if (msg.type === 'TRANSCRIPT' && msg.text) {
            this.transcriptCallback?.({
              text: msg.text,
              isFinal: msg.isFinal ?? true,
              timestamp: msg.timestamp ?? Date.now(),
              source: 'websocket'
            });
          }
        } catch {
          // Non-JSON or malformed message — ignore
        }
      };

      this.ws.onerror = () => {
        this.errorCallback?.('WebSocket connection error');
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        } else {
          this.setStatus('idle');
        }
      };
    } catch (e) {
      this.setStatus('error');
      this.errorCallback?.(`Failed to connect to Hover OS at ${this.url}`);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('error');
      this.errorCallback?.('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private setStatus(status: VoiceAdapterStatus): void {
    this.status = status;
    this.statusCallback?.(status);
  }

  start(): void {
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;
    this.connect();
  }

  stop(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
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
    this.transcriptCallback = null;
    this.errorCallback = null;
    this.statusCallback = null;
  }
}
