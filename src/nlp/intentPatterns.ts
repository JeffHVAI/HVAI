// ============================================================
// Intent Patterns — Clinical Pattern Library (15 Intent Types)
// ============================================================
// Each pattern entry defines trigger phrases, entity extraction
// regex patterns, and metadata for a specific clinical intent.

import type { ClinicalIntentType } from '../types';

export interface IntentPattern {
  type: ClinicalIntentType;
  /** Phrases that trigger this intent (lowercase). Matched against the transcript. */
  triggerPhrases: string[];
  /** Regex patterns to extract entities from the matched text. */
  entityPatterns: Record<string, RegExp>;
  /** Base confidence when trigger phrase matches (0.0-1.0). */
  baseConfidence: number;
  /** Human-readable label for the pillbox title. */
  actionLabel: string;
  /** Description template. Use {{entity}} placeholders. */
  descriptionTemplate: string;
  /** EHR endpoint path template. */
  ehrEndpoint: string;
  /** HTTP method for the EHR operation. */
  ehrMethod: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Lucide icon name for the primary pillbox. */
  icon: string;
}

export const INTENT_PATTERNS: IntentPattern[] = [
  // --- Demographics ---
  {
    type: 'UPDATE_ADDRESS',
    triggerPhrases: [
      'moved to', 'new address is', 'i live at', 'my address is',
      'address changed', 'living at', 'moved last', 'relocated to'
    ],
    entityPatterns: {
      address: /(?:moved to|address is|live at|living at|relocated to)\s+(.+?)(?:\.|,\s*(?:and|but)|$)/i
    },
    baseConfidence: 0.82,
    actionLabel: 'Update Patient Address',
    descriptionTemplate: 'Spoken address detected: "{{address}}"',
    ehrEndpoint: '/api/patients/:id/demographics',
    ehrMethod: 'PUT',
    icon: 'MapPin'
  },
  {
    type: 'UPDATE_PHONE',
    triggerPhrases: [
      'new phone number', 'call me at', 'my number is', 'phone changed',
      'reach me at', 'contact number', 'cell is', 'mobile is'
    ],
    entityPatterns: {
      phone: /(?:at|is|number)\s+([\d\s\-().+]{7,})/i
    },
    baseConfidence: 0.78,
    actionLabel: 'Update Phone Number',
    descriptionTemplate: 'New phone detected: "{{phone}}"',
    ehrEndpoint: '/api/patients/:id/demographics',
    ehrMethod: 'PUT',
    icon: 'Phone'
  },
  {
    type: 'UPDATE_INSURANCE',
    triggerPhrases: [
      'switched to', 'new insurance', 'changed insurance', 'insurance is now',
      'covered by', 'policy number'
    ],
    entityPatterns: {
      carrier: /(?:switched to|insurance is|covered by|changed to)\s+([A-Za-z\s]+?)(?:\s*,|\s*\.|\s+policy|\s+and|$)/i,
      policyId: /policy\s*(?:number|#|id)?\s*[:\s]?\s*([A-Za-z0-9\-]+)/i
    },
    baseConfidence: 0.72,
    actionLabel: 'Update Insurance Information',
    descriptionTemplate: 'New insurance carrier: "{{carrier}}"',
    ehrEndpoint: '/api/patients/:id/demographics',
    ehrMethod: 'PUT',
    icon: 'CreditCard'
  },

  // --- Allergies ---
  {
    type: 'ADD_ALLERGY',
    triggerPhrases: [
      'allergic to', 'allergy to', 'reaction to', 'had a reaction',
      'breaks out', 'can\'t take', 'bad reaction', 'hives from',
      'rash from', 'anaphylaxis', 'swelling from'
    ],
    entityPatterns: {
      substance: /(?:allergic to|allergy to|reaction to|can't take|hives from|rash from)\s+([A-Za-z\s/]+?)(?:\s*[,.]|\s+(?:a few|several|last|and|but|it|she|he|I|which|that))/i,
      reaction: /(?:got|had|gets|causes?|gave|with)\s+(?:a\s+)?(?:bad\s+)?(?:nasty\s+)?(rash|hives|swelling|anaphylaxis|nausea|vomiting|difficulty breathing|itching|throat\s+swelling)/i
    },
    baseConfidence: 0.88,
    actionLabel: 'Add Allergy to Record',
    descriptionTemplate: 'Allergy detected: {{substance}} → {{reaction}}',
    ehrEndpoint: '/api/patients/:id/allergies',
    ehrMethod: 'POST',
    icon: 'ShieldAlert'
  },
  {
    type: 'REMOVE_ALLERGY',
    triggerPhrases: [
      'not allergic', 'no longer allergic', 'allergy resolved',
      'allergy was wrong', 'tolerate it now', 'can take it now'
    ],
    entityPatterns: {
      substance: /(?:not allergic to|no longer allergic to|tolerate|can take)\s+([A-Za-z\s/]+?)(?:\s*[,.]|$)/i
    },
    baseConfidence: 0.70,
    actionLabel: 'Remove/Resolve Allergy',
    descriptionTemplate: 'Allergy removal: {{substance}}',
    ehrEndpoint: '/api/patients/:id/allergies',
    ehrMethod: 'PUT',
    icon: 'ShieldOff'
  },

  // --- Medications ---
  {
    type: 'RECONCILE_MEDICATION',
    triggerPhrases: [
      'still taking', 'stopped taking', 'changed dosage', 'dose changed',
      'switched from', 'taking it differently', 'adjusted dose'
    ],
    entityPatterns: {
      medication: /(?:taking|stopped|switched from|changed)\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s*[,.]|\s+(?:to|and|but|a|the)|$)/i,
      dosage: /(\d+\s*(?:mg|mcg|ml|units?|tablets?|capsules?))/i
    },
    baseConfidence: 0.80,
    actionLabel: 'Medication Reconciliation',
    descriptionTemplate: 'Medication change: {{medication}}',
    ehrEndpoint: '/api/patients/:id/medications',
    ehrMethod: 'PUT',
    icon: 'Pill'
  },
  {
    type: 'ADD_MEDICATION',
    triggerPhrases: [
      'start them on', 'prescribe', 'begin', 'put them on',
      'start taking', 'new medication', 'going to order', 'adding'
    ],
    entityPatterns: {
      medication: /(?:start (?:them|her|him|you) on|prescribe|begin|put (?:them|her|him) on|adding)\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s+\d|\s*[,.]|\s+(?:at|and|for|twice|once|daily)|$)/i,
      dosage: /(\d+\s*(?:mg|mcg|ml|units?))/i,
      route: /(oral|IV|IM|subcutaneous|topical|inhaled|sublingual)/i
    },
    baseConfidence: 0.85,
    actionLabel: 'Prescribe New Medication',
    descriptionTemplate: 'New medication: {{medication}}',
    ehrEndpoint: '/api/patients/:id/medications',
    ehrMethod: 'POST',
    icon: 'PlusCircle'
  },
  {
    type: 'DISCONTINUE_MEDICATION',
    triggerPhrases: [
      'stop the', 'discontinue', 'no longer needs', 'take them off',
      'hold the', 'cancel the medication', 'd/c the'
    ],
    entityPatterns: {
      medication: /(?:stop|discontinue|hold|cancel|d\/c|take (?:them|her|him) off)\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s*[,.]|$)/i
    },
    baseConfidence: 0.82,
    actionLabel: 'Discontinue Medication',
    descriptionTemplate: 'Discontinue: {{medication}}',
    ehrEndpoint: '/api/patients/:id/medications',
    ehrMethod: 'PUT',
    icon: 'MinusCircle'
  },

  // --- Orders ---
  {
    type: 'ORDER_LAB',
    triggerPhrases: [
      'order a', 'blood work', 'check the', 'lab work', 'draw blood',
      'let\'s check', 'send off', 'get a cbc', 'get a cmp', 'creatinine',
      'hemoglobin', 'a1c', 'lipid panel', 'thyroid'
    ],
    entityPatterns: {
      labTest: /(?:order|check|send off|get|draw)\s+(?:a\s+)?(?:the\s+)?(CBC|CMP|BMP|creatinine|hemoglobin|A1C|HbA1c|lipid panel|TSH|thyroid|troponin|INR|PT|PTT|BNP|D-dimer|urinalysis|UA|blood (?:work|culture)|(?:liver|renal|hepatic) (?:panel|function))/i,
      urgency: /(stat|urgent|routine|asap)/i
    },
    baseConfidence: 0.90,
    actionLabel: 'Order Laboratory Test',
    descriptionTemplate: 'Lab order: {{labTest}}',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'TestTube'
  },
  {
    type: 'ORDER_IMAGING',
    triggerPhrases: [
      'order a ct', 'order an', 'ultrasound', 'x-ray', 'mri',
      'imaging', 'scan', 'radiograph', 'need an x-ray', 'need a ct',
      'need an mri', 'order an ultrasound'
    ],
    entityPatterns: {
      study: /(CT|MRI|ultrasound|US|x-ray|radiograph|PET|DEXA|mammogram|echo|echocardiogram)/i,
      bodyPart: /(?:of the|of)\s+([A-Za-z\s/]+?)(?:\s+(?:with|without|complete|stat|for)|[,.]|$)/i,
      protocol: /(with contrast|without contrast|complete|limited|portable|stat)/i
    },
    baseConfidence: 0.88,
    actionLabel: 'Order Imaging Study',
    descriptionTemplate: 'Imaging: {{study}} {{bodyPart}}',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'ScanLine'
  },
  {
    type: 'ORDER_REFERRAL',
    triggerPhrases: [
      'refer to', 'referral to', 'see a specialist', 'consult',
      'send them to', 'follow up with'
    ],
    entityPatterns: {
      specialty: /(?:refer to|referral to|consult|send (?:them|her|him) to|follow up with)\s+(?:a\s+)?([A-Za-z\s]+?)(?:\s+(?:for|about|regarding)|[,.]|$)/i,
      reason: /(?:for|about|regarding)\s+(.+?)(?:[,.]|$)/i
    },
    baseConfidence: 0.80,
    actionLabel: 'Specialist Referral',
    descriptionTemplate: 'Referral: {{specialty}}',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'UserPlus'
  },

  // --- Vitals ---
  {
    type: 'RECORD_VITALS',
    triggerPhrases: [
      'blood pressure is', 'bp is', 'temperature is', 'temp is',
      'heart rate is', 'pulse is', 'oxygen', 'spo2', 'respiratory rate',
      'weight is', 'weighs', 'bmi is'
    ],
    entityPatterns: {
      vitalType: /(blood pressure|BP|temperature|temp|heart rate|pulse|SPO2|oxygen|respiratory rate|RR|weight|BMI)/i,
      value: /(?:is|at|of|reads?)\s+([\d/.]+)/i,
      unit: /(mmHg|bpm|°F|°C|%|lbs?|kg|breaths\/min)/i
    },
    baseConfidence: 0.92,
    actionLabel: 'Record Vital Signs',
    descriptionTemplate: '{{vitalType}}: {{value}}',
    ehrEndpoint: '/api/patients/:id/vitals',
    ehrMethod: 'PUT',
    icon: 'Heart'
  },

  // --- Problem List ---
  {
    type: 'UPDATE_PROBLEM_LIST',
    triggerPhrases: [
      'diagnosed with', 'new diagnosis', 'history of', 'presenting with',
      'has developed', 'confirmed diagnosis', 'assessment is'
    ],
    entityPatterns: {
      condition: /(?:diagnosed with|diagnosis of|history of|presenting with|developed|assessment is)\s+([A-Za-z\s]+?)(?:\s*[,.]|\s+(?:and|but|which|that|for)|$)/i
    },
    baseConfidence: 0.78,
    actionLabel: 'Update Problem List',
    descriptionTemplate: 'New/updated condition: {{condition}}',
    ehrEndpoint: '/api/patients/:id/problems',
    ehrMethod: 'PUT',
    icon: 'ClipboardList'
  },

  // --- Procedures ---
  {
    type: 'SCHEDULE_PROCEDURE',
    triggerPhrases: [
      'schedule a', 'book the', 'set up a', 'need to schedule',
      'schedule the procedure', 'schedule surgery', 'colonoscopy',
      'endoscopy', 'biopsy'
    ],
    entityPatterns: {
      procedure: /(?:schedule|book|set up)\s+(?:a\s+)?(?:the\s+)?([A-Za-z\s]+?)(?:\s+(?:for|in|within|next)|[,.]|$)/i,
      timeframe: /(?:for|in|within|next)\s+([\w\s]+?)(?:[,.]|$)/i
    },
    baseConfidence: 0.80,
    actionLabel: 'Schedule Procedure',
    descriptionTemplate: 'Procedure: {{procedure}}',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'Calendar'
  },

  // --- Prescriptions ---
  {
    type: 'RENEW_PRESCRIPTION',
    triggerPhrases: [
      'refill', 'renew', 'renewal', 'prescription renewal',
      'another supply', 'needs more', 'continue the', 'keep them on'
    ],
    entityPatterns: {
      medication: /(?:refill|renew|continue|keep (?:them|her|him) on)\s+(?:the\s+)?(?:a\s+)?([A-Za-z\s]+?)(?:\s+(?:for|and|at)|[,.]|$)/i,
      quantity: /(\d+)\s*(?:day|month|week|pill|tablet|capsule)/i
    },
    baseConfidence: 0.82,
    actionLabel: 'Renew Prescription',
    descriptionTemplate: 'Rx renewal: {{medication}}',
    ehrEndpoint: '/api/patients/:id/medications',
    ehrMethod: 'PUT',
    icon: 'RefreshCw'
  },

  // --- Deictic CPOE & Margaret Davis Workflow Intents ---
  {
    type: 'INTENT_ORDER_LAB',
    triggerPhrases: [
      'acute abdominal lab panel', 'lab panel', 'order cbc', 'order cmp', 'acute labs',
      'abdominal labs', 'cbc cmp lipase lactate'
    ],
    entityPatterns: {
      panel: /(acute abdominal lab panel|cbc|cmp|lipase|lactate)/i
    },
    baseConfidence: 0.92,
    actionLabel: '[LAB] Acute Abdominal Lab Panel',
    descriptionTemplate: 'Staged labs: CBC, CMP, Lipase, Lactate STAT',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'Activity'
  },
  {
    type: 'INTENT_ORDER_IMAGING',
    triggerPhrases: [
      'queue a ct abdomen', 'ct abdomen and pelvis', 'ct abdomen', 'ct scan',
      'ct with iv contrast', 'ct abdomen and pelvis with iv contrast'
    ],
    entityPatterns: {
      study: /(ct abdomen and pelvis|ct abdomen|ct scan)/i,
      contrast: /(iv contrast|with contrast)/i
    },
    baseConfidence: 0.95,
    actionLabel: '[RAD] CT Abdomen/Pelvis W/ IV Contrast',
    descriptionTemplate: 'CPT 74177 • Protocol: IV Contrast • Reason: LLQ Pain / Diverticulitis Rule-Out',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'FileText'
  },
  {
    type: 'INTENT_ORDER_MEDICATION',
    triggerPhrases: [
      'normal saline bolus', 'one liter normal saline', 'four milligrams iv morphine',
      'morphine', 'saline bolus', 'augmentin', 'discharge prescription'
    ],
    entityPatterns: {
      medication: /(normal saline|morphine|augmentin)/i,
      dose: /(one liter|1l|four milligrams|4 mg|875\/125 mg)/i
    },
    baseConfidence: 0.90,
    actionLabel: '[MED] Staged Clinical Orders',
    descriptionTemplate: 'Medication order staged for verification',
    ehrEndpoint: '/api/patients/:id/orders',
    ehrMethod: 'POST',
    icon: 'Pill'
  },
  {
    type: 'INTENT_CDS_OVERRIDE',
    triggerPhrases: [
      'override renal alert', 'override contrast warning', 'override alert',
      'creatinine alert', 'renal caution', 'surgical rule-out takes precedence'
    ],
    entityPatterns: {
      rationale: /(saline bolus complete|surgical rule-out|precedence|hydrated)/i
    },
    baseConfidence: 0.96,
    actionLabel: '[WARN] Cr 1.3 mg/dL - Contrast Warning',
    descriptionTemplate: 'Serum Creatinine 1.3 mg/dL • Renal Caution for IV Contrast',
    ehrEndpoint: '/api/patients/:id/alerts/override',
    ehrMethod: 'PUT',
    icon: 'ShieldAlert'
  },
  {
    type: 'INTENT_PROBLEM_ADD',
    triggerPhrases: [
      'acute uncomplicated diverticulitis', 'diverticulitis', 'sigmoid diverticulitis',
      'diverticulitis of sigmoid colon'
    ],
    entityPatterns: {
      dx: /(diverticulitis|sigmoid diverticulitis)/i
    },
    baseConfidence: 0.94,
    actionLabel: '[DX] Diverticulitis of Sigmoid Colon (K57.32)',
    descriptionTemplate: 'ICD-10-CM K57.32 • Acute uncomplicated diverticulitis of large intestine',
    ehrEndpoint: '/api/patients/:id/problems',
    ehrMethod: 'POST',
    icon: 'Heart'
  },
  {
    type: 'INTENT_ATTEST_NOTE',
    triggerPhrases: [
      'attest note', 'update ed course', 'lock and sign note', 'attest', 'provider note'
    ],
    entityPatterns: {
      reassessment: /(reassessment|pain controlled|attest)/i
    },
    baseConfidence: 0.95,
    actionLabel: '[NOTE] ED Attestation & Provider Sign-off',
    descriptionTemplate: 'Attest ED Note • Reassessment @ 12:45 PM • Pain 2/10 • Cryptographically Signed',
    ehrEndpoint: '/api/patients/:id/note/attest',
    ehrMethod: 'POST',
    icon: 'Sparkles'
  },
  {
    type: 'INTENT_DISPOSITION',
    triggerPhrases: [
      'finalize discharge', 'discharge home', 'discharged home', 'sign and discharge',
      'discharge patient', 'discharge disposition'
    ],
    entityPatterns: {
      disp: /(discharged home|home|routine)/i
    },
    baseConfidence: 0.98,
    actionLabel: '[DISP] Discharged Home (Routine)',
    descriptionTemplate: 'Encounter Closure • AVS Printed • Follow-up 48h PCP • Colonoscopy 6wks',
    ehrEndpoint: '/api/patients/:id/disposition',
    ehrMethod: 'PUT',
    icon: 'UserPlus'
  }
];
