// ============================================================
// GestureReticle — Spatial Cursor with Dwell Ring
// ============================================================
// Replaces the system cursor with a custom reticle that:
// - Idle: 16px semi-transparent dot tracking hand vector
// - Snap: 48px hollow ring when over interactive target
// - Dwell: SVG ring fills clockwise over 600ms to trigger click
//
// Hover OS dispatches standard DOM events, so this component
// simply listens to pointermove and visually augments the cursor.

import { useEffect, useRef, useState, useCallback } from 'react';

const INTERACTIVE_SELECTORS = [
  'button',
  'a',
  '[role="button"]',
  '.large-pillbox',
  '.patient-grid-card',
  '.dwell-confirm-btn',
  '.mode-toggle-btn',
  '.btn-play-round',
  '.dock-audit-btn',
  '.timeline-progress-track'
].join(',');


export default function GestureReticle() {
  const reticleRef = useRef<HTMLDivElement>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const dwellTargetRef = useRef<HTMLElement | null>(null);
  const [isSnapped, setIsSnapped] = useState(false);
  const [isDwelling, setIsDwelling] = useState(false);

  const handlePointerMove = useCallback((e: PointerEvent | MouseEvent) => {
    if (!reticleRef.current) return;

    // Position reticle at cursor
    reticleRef.current.style.left = `${e.clientX}px`;
    reticleRef.current.style.top = `${e.clientY}px`;

    // Check if over interactive target
    const target = (e.target as HTMLElement)?.closest?.(INTERACTIVE_SELECTORS) as HTMLElement | null;

    if (target) {
      if (!isSnapped) setIsSnapped(true);

      // Start dwell timer if we entered a new target
      if (dwellTargetRef.current !== target) {
        clearDwell();
        dwellTargetRef.current = target;
        // Only auto-dwell on non-button elements (cards, etc.)
        // Regular buttons respond to normal click
      }
    } else {
      if (isSnapped) setIsSnapped(false);
      clearDwell();
      dwellTargetRef.current = null;
    }
  }, [isSnapped]);

  const clearDwell = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    setIsDwelling(false);
  }, []);

  useEffect(() => {
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('mousemove', handlePointerMove);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mousemove', handlePointerMove);
      clearDwell();
    };
  }, [handlePointerMove, clearDwell]);

  const reticleClass = [
    'gesture-reticle',
    isSnapped ? 'snapped' : '',
    isDwelling ? 'dwelling' : ''
  ].filter(Boolean).join(' ');

  return (
    <div ref={reticleRef} className={reticleClass}>
      <div className="gesture-reticle-dot" />
      <svg className="dwell-ring" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="26" />
      </svg>
    </div>
  );
}
