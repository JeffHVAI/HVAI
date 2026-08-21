// ============================================================
// BorderDock — Left Sidebar (Extracted from App.tsx)
// ============================================================
// Displays static EHR patient context: identity, allergies,
// orders, labs, medications, vitals, and audit log.


import {
  FileText, User, ShieldAlert, Heart, TrendingUp,
  Pill, Activity
} from 'lucide-react';
import type { PatientRecord, AuditLogEvent } from '../types';

interface BorderDockProps {
  patient: PatientRecord | null;
  auditLogs: AuditLogEvent[];
}

export default function BorderDock({ patient, auditLogs }: BorderDockProps) {
  if (!patient) {
    return (
      <aside className="border-dock">
        <div className="dock-section-title">
          <FileText style={{ width: 15, height: 15 }} />
          EHR Patient Profile
        </div>
        <div className="static-card" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No patient selected. Choose a patient to begin.
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="border-dock">
      {/* Section: Patient Profile Header */}
      <div className="dock-section-title">
        <FileText style={{ width: 15, height: 15 }} />
        EHR Patient Profile (Live)
      </div>

      {/* Patient Identity Card */}
      <div className="static-card">
        <div className="patient-identity">
          <div className="patient-avatar">
            <User style={{ width: 24, height: 24 }} />
          </div>
          <div className="patient-primary-info">
            <h3>{patient.name}</h3>
            <div className="patient-mrn">MRN: {patient.mrn}</div>
          </div>
        </div>

        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">DOB / Age</span>
            <span className="meta-value">{patient.dob} ({patient.age} y)</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Gender</span>
            <span className="meta-value">{patient.gender}</span>
          </div>
          <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
            <span className="meta-label">Address</span>
            <span className={`meta-value ${patient.addressFlag ? 'flagged' : ''}`}>
              {patient.address}
              {patient.addressFlag && ` [Flagged]`}
            </span>
          </div>
          {patient.phone && (
            <div className="meta-item" style={{ gridColumn: '1 / -1' }}>
              <span className="meta-label">Phone</span>
              <span className="meta-value">{patient.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Allergies Card */}
      <div className="dock-section-title">
        <ShieldAlert style={{ width: 15, height: 15 }} />
        Allergies &amp; Contraindications
      </div>
      <div className="static-card">
        <div className="static-badge-row">
          {patient.allergies.map((a, idx) => (
            <span
              key={idx}
              className={`dock-badge ${a.substance.includes('NKDA') ? 'nkda' : 'allergy'}`}
            >
              {a.substance} ({a.reaction}) • {a.status}
            </span>
          ))}
        </div>
      </div>

      {/* Medications Card */}
      {patient.medications && patient.medications.length > 0 && (
        <>
          <div className="dock-section-title">
            <Pill style={{ width: 15, height: 15 }} />
            Active Medications
          </div>
          <div className="static-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {patient.medications.filter(m => m.status === 'active').map((m, idx) => (
                <div key={idx} className="dock-order-item signed">
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{m.name}</strong>
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {m.dosage} {m.route} {m.frequency}
                    </div>
                  </div>
                  <span className="dock-badge nkda">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Active Orders Card */}
      <div className="dock-section-title">
        <Heart style={{ width: 15, height: 15 }} />
        Active Orders
      </div>
      <div className="static-card">
        {patient.orders.length === 0 ? (
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No orders in current session.
          </span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patient.orders.map((o) => (
              <div key={o.id} className={`dock-order-item ${(o.status || 'active').toLowerCase()}`}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{o.name || 'Clinical Order'}</strong>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {(o.type || 'ORDER').toUpperCase()} • ID: {o.id}
                  </div>
                </div>
                <span className={`dock-badge ${o.status === 'SIGNED' || o.status === 'COMPLETED' ? 'nkda' : o.status === 'CANCELLED' ? 'allergy' : ''}`}>
                  {o.status || 'ACTIVE'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vitals Card */}
      {patient.vitals && patient.vitals.length > 0 && (
        <>
          <div className="dock-section-title">
            <Activity style={{ width: 15, height: 15 }} />
            Recent Vitals
          </div>
          <div className="static-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {patient.vitals.map((v, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{v.type}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {v.value} {v.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Renal / Labs Card */}
      {patient.labs && patient.labs.length > 0 && (
        <>
          <div className="dock-section-title">
            <TrendingUp style={{ width: 15, height: 15 }} />
            Lab Trend
          </div>
          <div className="static-card">
            <table className="mini-lab-table">
              <thead>
                <tr>
                  {patient.labs.map((l, idx) => (
                    <th key={idx}>{l.date}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {patient.labs.map((l, idx) => (
                    <td key={idx}>
                      {idx === patient.labs.length - 1 ? (
                        <strong style={{ color: 'var(--brand-interactive)' }}>{l.value}</strong>
                      ) : (
                        l.value
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            {patient.labs[patient.labs.length - 1]?.flag && (
              <span style={{ color: 'var(--text-dim)' }}>
                {patient.labs[patient.labs.length - 1].flag}
              </span>
            )}
          </div>
        </>
      )}

      {/* Audit Status (minimal — no raw JSON) */}
      {auditLogs.length > 0 && (
        <div className="dock-section-title" style={{ marginTop: 8 }}>
          <FileText style={{ width: 13, height: 13 }} />
          Audit Events: {auditLogs.length}
        </div>
      )}
    </aside>
  );
}
