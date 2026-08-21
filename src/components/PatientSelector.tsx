// ============================================================
// PatientSelector — Patient Picker Grid Component
// ============================================================
// Displays a grid of mock patient cards for the clinician to
// select which patient to open the encounter with. Features
// simultaneous Dr. Patel RFID proximity badge scan authentication.

import { User, Activity, Heart, Baby, Stethoscope, Calendar } from 'lucide-react';
import type { PatientRecord } from '../types';

interface PatientSelectorProps {
  patients: PatientRecord[];
  onSelect: (patient: PatientRecord) => void;
  isLoading: boolean;
}

// Map patient scenario tags to icons
const SCENARIO_ICONS: Record<string, React.FC<any>> = {
  'acute-diverticulitis': Heart,
  'allergy-conflict': Heart,
  'medication-recon': Activity,
  'prenatal': Baby,
  'cardiac-followup': Stethoscope,
  'annual-wellness': Calendar
};

export default function PatientSelector({ patients, onSelect, isLoading }: PatientSelectorProps) {
  if (isLoading) {
    return (
      <div className="patient-selector-loading">
        <div className="loading-spinner" />
        <span>Loading patient roster from EHR...</span>
      </div>
    );
  }

  return (
    <div className="patient-selector">
      {/* Dr. Patel RFID Proximity Badge Scan Banner */}
      <div style={{
        width: '100%',
        maxWidth: 720,
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
        border: '2px solid var(--brand-interactive)',
        borderRadius: 20,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        boxShadow: '0 0 30px rgba(14, 165, 233, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--brand-interactive)',
            color: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 20
          }}>
            RFID
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
              Clinician Authentication: Dr. Patel, MD (#49102)
            </div>
            <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
              Proximity sensor active • Selecting a patient scans credential badge & initializes 5-Stage Storyboard
            </div>
          </div>
        </div>
        <span className="status-badge" style={{ borderColor: 'var(--status-success)', color: 'var(--status-success)' }}>
          <span className="status-indicator success" /> Ready
        </span>
      </div>

      <div className="patient-selector-header">
        <h2 className="stage-title" style={{ fontSize: 26 }}>Select Patient Profile</h2>
        <p className="stage-subtitle">
          Touch or click a patient card to scan Dr. Patel's badge and open the 5-stage clinical encounter.
        </p>
      </div>

      <div className="patient-grid">
        {patients.map(patient => {
          const ScenarioIcon = SCENARIO_ICONS[patient.scenarioTag ?? ''] ?? User;

          return (
            <button
              key={patient.id}
              className="patient-grid-card"
              onClick={() => onSelect(patient)}
            >
              <div className="patient-grid-avatar">
                <User style={{ width: 28, height: 28 }} />
              </div>
              <div className="patient-grid-info">
                <h4 className="patient-grid-name">{patient.name}</h4>
                <span className="patient-grid-meta">
                  {patient.age}y {patient.gender} • MRN: {patient.mrn}
                </span>
              </div>
              {patient.scenarioTag && (
                <div className="patient-grid-scenario">
                  <ScenarioIcon style={{ width: 14, height: 14 }} />
                  <span>{formatScenarioTag(patient.scenarioTag)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatScenarioTag(tag: string): string {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
