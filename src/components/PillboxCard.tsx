// ============================================================
// PillboxCard — Single Action Pillbox Component
// ============================================================
// Renders a single PillboxAction with its alternatives as
// large pillbox buttons. Handles selection and animation.


import {
  CheckCircle, XCircle, ShieldAlert, MapPin, Flag, Building,
  Sparkles, Clock, Heart, UserPlus, RefreshCw, PlusCircle,
  MinusCircle, Calendar, SkipForward, Phone, CreditCard,
  ClipboardList, AlertCircle
} from 'lucide-react';
import type { PillboxAction, PillboxAlternative } from '../types';

// Map icon name strings to Lucide components
const ICON_MAP: Record<string, React.FC<any>> = {
  CheckCircle, XCircle, ShieldAlert, MapPin, Flag, Building,
  Sparkles, Clock, Heart, UserPlus, RefreshCw, PlusCircle,
  MinusCircle, Calendar, SkipForward, Phone, CreditCard,
  ClipboardList, AlertCircle
};

interface PillboxCardProps {
  action: PillboxAction;
  onSelect: (actionId: string, alternativeId: string) => void;
  onDismiss: (actionId: string) => void;
}

export default function PillboxCard({ action, onSelect, onDismiss }: PillboxCardProps) {
  const isResolved = action.status !== 'PENDING';

  const confidencePercent = Math.round(action.confidence * 100);
  const confidenceColor =
    action.confidence >= 0.85 ? 'var(--status-success)' :
    action.confidence >= 0.70 ? 'var(--brand-interactive)' :
    'var(--status-warning)';

  const isCds = action.intentType === 'INTENT_CDS_OVERRIDE' || action.isCdsWarning;
  const selectedAlt = action.alternatives.find(a => a.id === action.selectedAlternativeId);

  return (
    <div className={`pillbox-card ${isResolved ? 'resolved' : 'pending'} ${action.status === 'DISMISSED' ? 'dismissed' : ''} ${isCds ? 'warning' : ''}`} style={isCds ? { borderColor: 'var(--status-warning)', boxShadow: '0 0 30px rgba(245, 158, 11, 0.25)' } : {}}>
      {/* Card Header */}
      <div className="pillbox-card-header">
        <div className="pillbox-card-title-row">
          <span className="pillbox-card-intent-tag" style={isCds ? { background: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-warning)' } : {}}>
            {isCds ? 'CDS WARNING ALERT' : formatIntentType(action.intentType)}
          </span>
          <h3 className="pillbox-card-title" style={isCds ? { color: 'var(--status-warning)' } : {}}>
            {action.title}
          </h3>
        </div>
        <div className="pillbox-card-meta">
          <div className="pillbox-card-confidence">
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${confidencePercent}%`, background: confidenceColor }}
              />
            </div>
            <span className="confidence-label" style={{ color: confidenceColor }}>
              {confidencePercent}%
            </span>
          </div>
          {action.status === 'CONFIRMED' && (
            <span className="pillbox-card-status confirmed">
              <CheckCircle style={{ width: 18, height: 18 }} /> Confirmed
            </span>
          )}
          {action.status === 'DISMISSED' && (
            <span className="pillbox-card-status dismissed">
              <XCircle style={{ width: 18, height: 18 }} /> Dismissed
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="pillbox-card-description">{action.description}</p>

      {/* Source Transcript Snippet */}
      <div className="pillbox-card-source">
        <span className="source-label">Detected from:</span>
        <span className="source-text">"{action.sourceText}"</span>
      </div>

      {/* Alternative Pillbox Buttons */}
      {!isResolved && (
        <div className="pillbox-group">
          {action.alternatives.map((alt) => (
            <AlternativeButton
              key={alt.id}
              alternative={alt}
              isSelected={action.selectedAlternativeId === alt.id}
              onClick={() => onSelect(action.id, alt.id)}
            />
          ))}
        </div>
      )}

      {/* Resolved: Show which alternative was selected */}
      {action.status === 'CONFIRMED' && selectedAlt && (
        <div className="pillbox-card-resolved-summary">
          <CheckCircle style={{ width: 22, height: 22, color: 'var(--status-success)' }} />
          <span>{selectedAlt.label}</span>
        </div>
      )}

      {/* Dismiss button for pending actions */}
      {!isResolved && (
        <button
          className="pillbox-card-dismiss"
          onClick={() => onDismiss(action.id)}
        >
          <XCircle style={{ width: 22, height: 22 }} />
          Dismiss
        </button>
      )}
    </div>
  );
}

/** Renders a single alternative as a large pillbox button. */
function AlternativeButton({
  alternative,
  isSelected,
  onClick
}: {
  alternative: PillboxAlternative;
  isSelected: boolean;
  onClick: () => void;
}) {
  const IconComponent = ICON_MAP[alternative.icon] ?? CheckCircle;

  const variantClass = alternative.variant === 'warning'
    ? 'warning'
    : alternative.variant === 'danger'
      ? 'danger'
      : '';

  return (
    <button
      className={`large-pillbox ${variantClass} ${isSelected ? 'committed' : ''}`}
      onClick={onClick}
    >
      <div className="pillbox-icon-container">
        <IconComponent style={{ width: 36, height: 36 }} />
      </div>
      <div className="pillbox-content-stack">
        <span className="pillbox-primary-label">{alternative.label}</span>
        <span className="pillbox-subtext">{alternative.description}</span>
      </div>
      <span className={`pillbox-status-tag ${isSelected ? 'committed' : alternative.isRecommended ? 'recommended' : ''}`}>
        {isSelected ? 'Selected ✓' : alternative.isRecommended ? '★ Recommended' : 'Select'}
      </span>
    </button>
  );
}

function formatIntentType(type: string): string {
  return type.replace(/_/g, ' ');
}
