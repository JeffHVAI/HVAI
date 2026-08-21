// ============================================================
// CT Viewer Component — Touchless Imaging Viewer (Zone C)
// ============================================================
// Renders CT Abdomen/Pelvis slice 54 with HUD overlay displaying
// window level (W: 400 L: 40), slice index (IMG 54/110), and
// sigmoid colon diverticulitis finding annotation.

import { useState } from 'react';
import { Layers, ChevronUp, ChevronDown } from 'lucide-react';

interface CtViewerProps {
  currentSlice?: number;
  totalSlices?: number;
  studyTitle?: string;
  onSliceChange?: (slice: number) => void;
}

export default function CtViewer({
  currentSlice = 54,
  totalSlices = 110,
  studyTitle = 'CT Abdomen/Pelvis W/ IV Contrast',
  onSliceChange
}: CtViewerProps) {
  const [slice, setSlice] = useState(currentSlice);

  const handleNext = () => {
    const next = Math.min(totalSlices, slice + 1);
    setSlice(next);
    onSliceChange?.(next);
  };

  const handlePrev = () => {
    const prev = Math.max(1, slice - 1);
    setSlice(prev);
    onSliceChange?.(prev);
  };

  return (
    <div style={{
      width: '100%',
      height: 400,
      backgroundColor: '#000000',
      border: '2px solid #1E293B',
      borderRadius: 20,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)'
    }}>
      {/* Top HUD Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '16px 24px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Layers style={{ width: 24, height: 24, color: 'var(--brand-interactive)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>{studyTitle}</div>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Series 3 • Axial Contrast Phase</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: 'monospace' }}>
          <span style={{ fontSize: 20, color: 'var(--brand-interactive)', fontWeight: 700 }}>
            IMG {slice}/{totalSlices}
          </span>
          <span style={{ fontSize: 18, color: 'var(--text-secondary)' }}>
            W: 400 L: 40
          </span>
        </div>
      </div>

      {/* Slice Viewport Canvas / Image Simulation */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: 'radial-gradient(circle at center, #1a2432 0%, #05080c 70%, #000000 100%)'
      }}>
        {/* Simulated Cross-sectional Scan Rings */}
        <div style={{
          width: 260,
          height: 260,
          borderRadius: '50%',
          border: '2px dashed rgba(14, 165, 233, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: 180,
            height: 180,
            borderRadius: '40%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Sigmoid Colon Inflammation Annotation Callout */}
            {slice === 54 && (
              <div style={{
                position: 'absolute',
                left: '20%',
                bottom: '25%',
                border: '2px solid var(--status-warning)',
                borderRadius: '50%',
                width: 56,
                height: 56,
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: -32,
                  left: -30,
                  whiteSpace: 'nowrap',
                  backgroundColor: 'rgba(245, 158, 11, 0.9)',
                  color: '#000000',
                  fontWeight: 800,
                  fontSize: 14,
                  padding: '4px 10px',
                  borderRadius: 6
                }}>
                  Sigmoid Diverticulitis
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical Scroll Handle Indicator */}
        <div style={{
          position: 'absolute',
          right: 24,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          zIndex: 10
        }}>
          <button
            onClick={handlePrev}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--surface-border)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'none'
            }}
          >
            <ChevronUp style={{ width: 24, height: 24 }} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-interactive)' }}>
            {slice}
          </span>
          <button
            onClick={handleNext}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--surface-border)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'none'
            }}
          >
            <ChevronDown style={{ width: 24, height: 24 }} />
          </button>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div style={{
        padding: '12px 24px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderTop: '1px solid var(--surface-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 16,
        color: 'var(--text-secondary)'
      }}>
        <span>Air-Scroll Active • Vertical hand displacement = slice index</span>
        <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>PACS Accession #AC-99201</span>
      </div>
    </div>
  );
}
