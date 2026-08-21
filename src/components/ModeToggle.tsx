// ============================================================
// ModeToggle — Demo/Live Mode Switch Component
// ============================================================
// Toggle switch in the header for switching between Demo Mode
// (scripted encounter playback) and Live Mode (real microphone).

import { Play, Mic } from 'lucide-react';
import type { AppMode } from '../types';

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-toggle-btn ${mode === 'demo' ? 'active' : ''}`}
        onClick={() => onChange('demo')}
      >
        <Play style={{ width: 14, height: 14 }} />
        Demo
      </button>
      <button
        className={`mode-toggle-btn ${mode === 'live' ? 'active' : ''}`}
        onClick={() => onChange('live')}
      >
        <Mic style={{ width: 14, height: 14 }} />
        Live
      </button>
    </div>
  );
}
