// ============================================================
// Hover Health Multi-Modal Simulator — Type Definitions
// ============================================================

// --- Voice Input Adapter Types ---

export type VoiceAdapterStatus = 'idle' | 'listening' | 'error' | 'connecting';

export interface TranscriptChunk {
  text: string;
  isFinal: boolean;
  timestamp: number;  // Date.now()
  source: 'microphone' | 'websocket' | 'demo';
}

// --- Clinical NLP Types ---

export type ClinicalIntentType =
  | 'UPDATE_ADDRESS'
  | 'UPDATE_PHONE'
  | 'UPDATE_INSURANCE'
  | 'ADD_ALLERGY'
  | 'REMOVE_ALLERGY'
  | 'RECONCILE_MEDICATION'
  | 'ADD_MEDICATION'
  | 'DISCONTINUE_MEDICATION'
  | 'ORDER_LAB'
  | 'ORDER_IMAGING'
  | 'ORDER_REFERRAL'
  | 'RECORD_VITALS'
  | 'UPDATE_PROBLEM_LIST'
  | 'SCHEDULE_PROCEDURE'
  | 'RENEW_PRESCRIPTION'
  | 'INTENT_ORDER_LAB'
  | 'INTENT_ORDER_IMAGING'
  | 'INTENT_ORDER_MEDICATION'
  | 'INTENT_CDS_OVERRIDE'
  | 'INTENT_PROBLEM_ADD'
  | 'INTENT_DISPOSITION'
  | 'INTENT_ATTEST_NOTE';

export interface ClinicalIntent {
  id: string;
  type: ClinicalIntentType;
  confidence: number;                      // 0.0 - 1.0
  sourceText: string;                      // Transcript fragment
  extractedEntities: Record<string, string>;
  timestamp: string;                       // ISO-8601
}

// --- Pillbox Action Queue Types ---

export type PillboxActionStatus = 'PENDING' | 'CONFIRMED' | 'DISMISSED' | 'EXPIRED';
export type PillboxVariant = 'primary' | 'warning' | 'danger' | 'success';

export interface PillboxAlternative {
  id: string;
  label: string;
  description: string;
  icon: string;            // Lucide icon name
  variant: PillboxVariant;
  isRecommended: boolean;
  payload: Record<string, any>;
  fhirResourceType?: string; // e.g. 'ServiceRequest', 'MedicationRequest', 'Condition', 'Encounter'
  fhirPayload?: Record<string, any>; // Full FHIR R4 JSON structure
}

export interface PillboxAction {
  id: string;
  intentType: ClinicalIntentType;
  status: PillboxActionStatus;
  title: string;
  description: string;
  sourceText: string;
  confidence: number;
  createdAt: string;
  resolvedAt?: string;
  alternatives: PillboxAlternative[];
  selectedAlternativeId?: string;
  ehrEndpoint: string;          // e.g., '/api/patients/:id/allergies'
  ehrMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  isCdsWarning?: boolean;
}

// --- EHR / Patient Record Types ---

export interface Allergy {
  id?: string;
  substance: string;
  reaction: string;
  severity?: 'mild' | 'moderate' | 'severe';
  status: string;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  status: 'active' | 'discontinued' | 'pending';
  prescriber?: string;
}

export interface LabResult {
  id?: string;
  test: string;
  date: string;
  value: string;
  unit?: string;
  flag?: string;
  referenceRange?: string;
}

export interface ImagingStudy {
  id?: string;
  study: string;
  currentSlice: number;
  totalSlices: number;
  status?: string;
  findings?: string;
}

export interface VitalSign {
  id?: string;
  type: string;       // 'BP', 'HR', 'TEMP', 'SPO2', 'RR', 'WEIGHT'
  value: string;
  unit: string;
  recordedAt: string;
}

export interface ProblemListItem {
  id?: string;
  condition: string;
  icdCode?: string;
  status: 'active' | 'resolved' | 'chronic';
  onsetDate?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  type: 'lab' | 'imaging' | 'referral' | 'procedure' | 'medication' | 'other';
  status: 'PENDING' | 'STAGED' | 'SIGNED' | 'CANCELLED' | 'COMPLETED';
  urgency?: 'routine' | 'stat' | 'urgent';
  details?: string;
}

export interface Insurance {
  carrier: string;
  policyId: string;
  groupNumber?: string;
  status: 'active' | 'inactive';
}

export interface PatientRecord {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  phone?: string;
  address: string;
  addressFlag?: string;
  insurance?: Insurance;
  allergies: Allergy[];
  medications: Medication[];
  labs: LabResult[];
  imaging: ImagingStudy;
  vitals: VitalSign[];
  problemList: ProblemListItem[];
  orders: OrderItem[];
  scenarioTag?: string;     // Short description of the patient's clinical scenario
}

// --- Audit Log Types ---

export interface AuditLogEvent {
  timestamp: string;
  actor: string;
  action: string;
  targetId: string;
  committedValue: any;
  roundTripLatencyMs: number;
  intentType?: ClinicalIntentType;
  confidence?: number;
}

// --- App Mode ---

export type AppMode = 'demo' | 'live';

// --- Timeline Types (retained for Demo Mode) ---

export interface TimelineEvent {
  timestamp: number;
  timestampString: string;
  eventId: string;
  title: string;
  description: string;
}

export type Speaker = 'System' | 'Dr. Patel' | 'Patient' | 'DAX' | 'Margaret Davis' | 'DAX Copilot';

export interface DialogueLine {
  start: number;
  end: number;
  speaker: Speaker;
  text: string;
}
