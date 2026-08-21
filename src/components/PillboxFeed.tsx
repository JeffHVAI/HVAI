// ============================================================
// PillboxFeed — Single-Focus Action Presentation
// ============================================================
// Shows ONE pending pillbox at a time (the most recent).
// If a new action arrives before the current is actioned,
// the previous is auto-committed to a compact history list.
// No scrolling — entire UI fits within the viewport.

import { Activity, Mic, CheckCircle, XCircle } from 'lucide-react';
import PillboxCard from './PillboxCard';
import type { PillboxAction, VoiceAdapterStatus } from '../types';

interface PillboxFeedProps {
  actions: PillboxAction[];
  voiceStatus: VoiceAdapterStatus;
  onSelect: (actionId: string, alternativeId: string) => void;
  onDismiss: (actionId: string) => void;
}

export default function PillboxFeed({
  actions,
  voiceStatus,
  onSelect,
  onDismiss
}: PillboxFeedProps) {
  const pending = actions.filter(a => a.status === 'PENDING');
  const resolved = actions.filter(a => a.status !== 'PENDING');

  // The single active pillbox is the MOST RECENT pending action
  const activePillbox = pending.length > 0 ? pending[pending.length - 1] : null;

  // All other pending (queued behind active) + all resolved go to history
  const historyItems = [
    ...pending.slice(0, pending.length - 1), // earlier pending — auto-committed
    ...resolved
  ].reverse(); // most recent first

  return (
    <div className="pillbox-feed">
      {/* Empty State — ambient listening indicator */}
      {actions.length === 0 && (
        <div className="pillbox-feed-empty">
          <div className={`listening-indicator ${voiceStatus === 'listening' ? 'active' : ''}`}>
            {voiceStatus === 'listening' ? (
              <Mic style={{ width: 24, height: 24 }} />
            ) : (
              <Activity style={{ width: 24, height: 24 }} />
            )}
          </div>
          <h3 className="feed-empty-title">
            {voiceStatus === 'listening'
              ? 'Listening for Clinical Intents...'
              : voiceStatus === 'idle'
                ? 'Ready'
                : 'Connecting...'}
          </h3>
          <p className="feed-empty-subtitle">
            {voiceStatus === 'listening'
              ? 'Speak naturally. Actions appear here for gesture confirmation.'
              : 'Start the encounter to begin ambient capture.'}
          </p>
        </div>
      )}

      {/* Active Pillbox — prominent, full-card, pop-in animation */}
      {activePillbox && (
        <PillboxCard
          key={activePillbox.id}
          action={activePillbox}
          onSelect={onSelect}
          onDismiss={onDismiss}
        />
      )}

      {/* Action History — compact rows below active card */}
      {historyItems.length > 0 && (
        <div className="action-history">
          <div className="action-history-title">Action History ({historyItems.length})</div>
          {historyItems.map(action => {
            const isConfirmed = action.status === 'CONFIRMED';
            const isDismissed = action.status === 'DISMISSED';
            const isPending = action.status === 'PENDING';
            return (
              <div
                key={action.id}
                className={`action-history-item ${isDismissed ? 'dismissed' : ''} ${isPending ? 'pending' : ''}`}
              >
                {isConfirmed && <CheckCircle style={{ width: 14, height: 14, color: 'var(--status-success)', flexShrink: 0 }} />}
                {isDismissed && <XCircle style={{ width: 14, height: 14, color: 'var(--text-dim)', flexShrink: 0 }} />}
                {isPending && <Activity style={{ width: 14, height: 14, color: 'var(--status-warning)', flexShrink: 0 }} />}
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {action.title}
                </span>
                {action.status !== 'PENDING' && (
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {action.status.toLowerCase()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
