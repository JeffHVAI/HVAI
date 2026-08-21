// ============================================================
// Keyword Trigger Map — Live Mode Pillbox Dispatch Table
// ============================================================
// Each entry defines a SPECIFIC set of keywords/phrases that,
// when heard in LIVE mode, trigger exactly one pillbox to appear.
//
// Design principles:
//  - One keyword = one pillbox type (no fan-out)
//  - Keywords are precise enough to avoid false triggers
//  - Short clinical phrases preferred over full sentences
//  - Match on normalized (lowercase, trimmed) transcript
//  - Entries are ordered by specificity (most specific first)
// ============================================================

import type { ClinicalIntentType } from '../types';

export interface KeywordTrigger {
  /**
   * Unique pillbox category label shown in the reference table.
   * Groups related keyword triggers under one named pillbox type.
   */
  pillboxCategory: string;

  /**
   * The clinical intent type this trigger fires.
   */
  intentType: ClinicalIntentType;

  /**
   * List of keywords or phrases (lowercase).
   * ANY single match causes this pillbox to fire.
   * Match is substring — 'cbc' matches 'order a cbc stat'.
   */
  keywords: string[];

  /**
   * Optional: ALL of these must be absent for the trigger to fire.
   * Use to prevent false positives near overlapping terms.
   */
  excludeIf?: string[];

  /** Confidence level for the generated intent (0.0–1.0) */
  confidence: number;

  /** Human-readable label for the pillbox card title */
  pillboxTitle: string;

  /** Short description shown in the pillbox card body */
  pillboxDescription: string;

  /** Entities to pre-populate in the intent */
  entities: Record<string, string>;
}

// ============================================================
// THE KEYWORD TRIGGER TABLE
// ============================================================
// CATEGORY                KEYWORDS                          PILLBOX
// ─────────────────────────────────────────────────────────────────
// Patient Identity        "hello mrs. davis", "mrs. davis"  Patient Profile Selection
// Address Update          "new address", "moved to"         Address Selection
// Lab Orders              "cbc", "cmp", "lipase", etc.      Lab Test Selection
// Imaging Orders          "ct scan", "mri", "x-ray", etc.  Imaging Study Selection
// Medication Orders       "morphine", "augmentin", etc.     Prescription Selection
// Allergy                 "allergic to", "allergy to"       Allergy Record Selection
// Vitals                  "blood pressure", "heart rate"    Vital Sign Selection
// Diagnosis               "diverticulitis", "diagnosed"     Diagnosis Selection
// CDS Override            "override", "override alert"      CDS Override Selection
// Note Attestation        "attest", "sign note"             Note Sign-off Selection
// Discharge               "discharge", "send home"          Discharge Selection
// Referral                "refer to", "referral"            Referral Selection
// Prescription Renewal    "refill", "renew"                 Renewal Selection
// ─────────────────────────────────────────────────────────────────

export const KEYWORD_TRIGGER_MAP: KeywordTrigger[] = [

  // ── PATIENT IDENTITY & DEMOGRAPHICS ──────────────────────────
  {
    pillboxCategory: 'Patient Name & Profile Selection',
    intentType: 'UPDATE_ADDRESS',
    keywords: [
      'hello mrs davis',
      'hello mrs. davis',
      'hi mrs davis',
      'hi mrs. davis',
      'good morning mrs davis',
      'good morning mrs. davis',
      'good afternoon mrs davis',
      'good evening mrs davis',
      'mrs davis',
    ],
    excludeIf: [],
    confidence: 0.90,
    pillboxTitle: 'Patient Profile — Margaret Davis',
    pillboxDescription: 'Confirm patient identity and verify registered address on file.',
    entities: {
      address: '742 Evergreen Terrace',
      addressFlag: 'VERIFY_ON_ARRIVAL'
    }
  },

  {
    pillboxCategory: 'Address Update',
    intentType: 'UPDATE_ADDRESS',
    keywords: [
      'new address',
      'moved to',
      'i live at',
      'my address is',
      'address changed',
      'living at',
      'relocated to',
    ],
    confidence: 0.85,
    pillboxTitle: 'Update Patient Address',
    pillboxDescription: 'Spoken address detected — confirm update to patient demographics.',
    entities: { address: '(spoken address)' }
  },

  {
    pillboxCategory: 'Phone Number Update',
    intentType: 'UPDATE_PHONE',
    keywords: [
      'new phone number',
      'call me at',
      'my number is',
      'phone changed',
      'reach me at',
      'contact number',
      'cell is',
      'mobile is',
    ],
    confidence: 0.82,
    pillboxTitle: 'Update Phone Number',
    pillboxDescription: 'New contact number spoken — verify and update chart.',
    entities: { phone: '(spoken number)' }
  },

  {
    pillboxCategory: 'Insurance Update',
    intentType: 'UPDATE_INSURANCE',
    keywords: [
      'new insurance',
      'switched insurance',
      'changed insurance',
      'insurance is now',
      'covered by',
      'policy number',
    ],
    confidence: 0.78,
    pillboxTitle: 'Update Insurance Information',
    pillboxDescription: 'New insurance information spoken — flag for registration desk.',
    entities: { carrier: '(spoken carrier)', policyId: '(spoken policy)' }
  },

  // ── LAB TEST ORDERS ───────────────────────────────────────────
  {
    pillboxCategory: 'Lab Test — Complete Blood Count',
    intentType: 'INTENT_ORDER_LAB',
    keywords: ['cbc', 'complete blood count'],
    excludeIf: ['cancel', 'no cbc'],
    confidence: 0.96,
    pillboxTitle: '[LAB] CBC — Complete Blood Count',
    pillboxDescription: 'STAT CBC order — WBC, RBC, Hgb, Hct, Plt.',
    entities: { panel: 'CBC', priority: 'stat' }
  },

  {
    pillboxCategory: 'Lab Test — Comprehensive Metabolic Panel',
    intentType: 'INTENT_ORDER_LAB',
    keywords: ['cmp', 'comprehensive metabolic', 'metabolic panel'],
    excludeIf: ['cancel', 'no cmp'],
    confidence: 0.96,
    pillboxTitle: '[LAB] CMP — Comprehensive Metabolic Panel',
    pillboxDescription: 'STAT CMP — Glucose, BUN, Creatinine, Electrolytes, LFTs.',
    entities: { panel: 'CMP', priority: 'stat' }
  },

  {
    pillboxCategory: 'Lab Test — Acute Abdominal Panel',
    intentType: 'INTENT_ORDER_LAB',
    keywords: [
      'acute abdominal lab',
      'acute lab panel',
      'abdominal lab panel',
      'lab panel',
      'lipase',
      'lactate',
      'cbc cmp',
      'order labs',
      'draw labs',
      'run labs',
      'blood work',
      'lab work',
    ],
    excludeIf: ['cancel', 'no labs'],
    confidence: 0.93,
    pillboxTitle: '[LAB] Acute Abdominal Lab Panel',
    pillboxDescription: 'STAT: CBC, CMP, Lipase, Lactate — acute abdominal workup.',
    entities: { panel: 'Acute Abdominal Panel', priority: 'stat' }
  },

  {
    pillboxCategory: 'Lab Test — HbA1c / Diabetes',
    intentType: 'ORDER_LAB',
    keywords: ['a1c', 'hba1c', 'hemoglobin a1c', 'glycated hemoglobin'],
    confidence: 0.90,
    pillboxTitle: '[LAB] HbA1c',
    pillboxDescription: 'Glycated hemoglobin — diabetes monitoring.',
    entities: { labTest: 'HbA1c', priority: 'routine' }
  },

  {
    pillboxCategory: 'Lab Test — Lipid Panel',
    intentType: 'ORDER_LAB',
    keywords: ['lipid panel', 'cholesterol', 'ldl', 'hdl', 'triglycerides'],
    confidence: 0.90,
    pillboxTitle: '[LAB] Lipid Panel',
    pillboxDescription: 'Total cholesterol, LDL, HDL, Triglycerides.',
    entities: { labTest: 'Lipid Panel', priority: 'routine' }
  },

  {
    pillboxCategory: 'Lab Test — Thyroid / TSH',
    intentType: 'ORDER_LAB',
    keywords: ['tsh', 'thyroid', 'thyroid function'],
    confidence: 0.90,
    pillboxTitle: '[LAB] TSH — Thyroid Function',
    pillboxDescription: 'Thyroid Stimulating Hormone panel.',
    entities: { labTest: 'TSH', priority: 'routine' }
  },

  {
    pillboxCategory: 'Lab Test — Troponin / Cardiac Markers',
    intentType: 'ORDER_LAB',
    keywords: ['troponin', 'bnp', 'ck-mb', 'cardiac markers', 'hs-troponin'],
    confidence: 0.94,
    pillboxTitle: '[LAB] Troponin / Cardiac Markers',
    pillboxDescription: 'High-sensitivity troponin — rule out ACS.',
    entities: { labTest: 'Troponin', priority: 'stat' }
  },

  {
    pillboxCategory: 'Lab Test — Urinalysis',
    intentType: 'ORDER_LAB',
    keywords: ['urinalysis', 'urine culture', 'ua and culture', 'urine test'],
    confidence: 0.90,
    pillboxTitle: '[LAB] Urinalysis & Culture',
    pillboxDescription: 'Urinalysis with microscopy and urine culture.',
    entities: { labTest: 'Urinalysis', priority: 'routine' }
  },

  {
    pillboxCategory: 'Lab Test — INR / Coagulation',
    intentType: 'ORDER_LAB',
    keywords: ['inr', 'pt', 'ptt', 'prothrombin', 'coagulation panel'],
    confidence: 0.90,
    pillboxTitle: '[LAB] Coagulation Panel (INR/PT/PTT)',
    pillboxDescription: 'Clotting factors — warfarin monitoring or pre-op.',
    entities: { labTest: 'INR/PT/PTT', priority: 'routine' }
  },

  // ── IMAGING ORDERS ────────────────────────────────────────────
  {
    pillboxCategory: 'Imaging — CT Abdomen/Pelvis',
    intentType: 'INTENT_ORDER_IMAGING',
    keywords: [
      'ct abdomen',
      'ct scan abdomen',
      'ct of the abdomen',
      'ct abd pelvis',
      'ct abdomen and pelvis',
      'ct with iv contrast',
      'queue a ct',
      'order a ct',
    ],
    excludeIf: ['cancel', 'no ct'],
    confidence: 0.97,
    pillboxTitle: '[RAD] CT Abdomen/Pelvis W/ IV Contrast',
    pillboxDescription: 'CPT 74177 — IV contrast protocol, LLQ pain workup.',
    entities: { study: 'CT Abdomen and Pelvis', contrast: 'IV', cpt: '74177' }
  },

  {
    pillboxCategory: 'Imaging — CT Chest',
    intentType: 'ORDER_IMAGING',
    keywords: ['ct chest', 'chest ct', 'pulmonary embolism ct', 'pe protocol'],
    confidence: 0.94,
    pillboxTitle: '[RAD] CT Chest — PE Protocol',
    pillboxDescription: 'CT Pulmonary Angiography — rule out pulmonary embolism.',
    entities: { study: 'CT Chest', protocol: 'PE protocol' }
  },

  {
    pillboxCategory: 'Imaging — MRI',
    intentType: 'ORDER_IMAGING',
    keywords: ['mri', 'magnetic resonance', 'mri brain', 'mri spine', 'mri abdomen'],
    confidence: 0.92,
    pillboxTitle: '[RAD] MRI — Select Region',
    pillboxDescription: 'MRI order — confirm body region and protocol.',
    entities: { study: 'MRI', bodyPart: '(spoken region)' }
  },

  {
    pillboxCategory: 'Imaging — Ultrasound',
    intentType: 'ORDER_IMAGING',
    keywords: [
      'ultrasound',
      'us abdomen',
      'abdominal ultrasound',
      'right upper quadrant',
      'ruq ultrasound',
      'pelvic ultrasound',
      'renal ultrasound',
    ],
    confidence: 0.92,
    pillboxTitle: '[RAD] Ultrasound — Abdominal',
    pillboxDescription: 'Abdominal ultrasound — real-time imaging, no radiation.',
    entities: { study: 'Ultrasound', bodyPart: 'Abdomen' }
  },

  {
    pillboxCategory: 'Imaging — Chest X-Ray',
    intentType: 'ORDER_IMAGING',
    keywords: ['chest x-ray', 'cxr', 'chest xray', 'x-ray chest', 'portable cxr'],
    confidence: 0.92,
    pillboxTitle: '[RAD] Chest X-Ray (PA/Lateral)',
    pillboxDescription: 'Two-view chest radiograph — portable or department.',
    entities: { study: 'X-Ray', bodyPart: 'Chest' }
  },

  {
    pillboxCategory: 'Imaging — Echocardiogram',
    intentType: 'ORDER_IMAGING',
    keywords: ['echo', 'echocardiogram', 'transthoracic echo', 'tte', 'cardiac echo'],
    confidence: 0.90,
    pillboxTitle: '[CARD] Transthoracic Echocardiogram',
    pillboxDescription: 'TTE — cardiac function, wall motion, valvular assessment.',
    entities: { study: 'Echo', bodyPart: 'Heart' }
  },

  // ── MEDICATION / PRESCRIPTION ─────────────────────────────────
  {
    pillboxCategory: 'Prescription — IV Morphine (Analgesia)',
    intentType: 'INTENT_ORDER_MEDICATION',
    keywords: ['morphine', 'iv morphine', 'four milligrams morphine', '4mg morphine'],
    excludeIf: ['discontinue', 'stop morphine', 'cancel'],
    confidence: 0.95,
    pillboxTitle: '[MED] Morphine 4 mg IV STAT',
    pillboxDescription: 'IV push analgesia — acute pain management.',
    entities: { medication: 'Morphine', dose: '4 mg', route: 'IV', frequency: 'STAT' }
  },

  {
    pillboxCategory: 'Prescription — Normal Saline IV Bolus',
    intentType: 'INTENT_ORDER_MEDICATION',
    keywords: [
      'normal saline',
      'saline bolus',
      'one liter saline',
      '1l normal saline',
      '1 liter saline',
      'iv fluids',
      'iv hydration',
    ],
    excludeIf: ['discontinue', 'stop saline'],
    confidence: 0.93,
    pillboxTitle: '[MED] 1L Normal Saline IV Bolus',
    pillboxDescription: 'IV hydration — 1000 mL NS over 1 hour.',
    entities: { medication: 'Normal Saline', dose: '1000 mL', route: 'IV' }
  },

  {
    pillboxCategory: 'Prescription — Augmentin (Discharge Antibiotic)',
    intentType: 'INTENT_ORDER_MEDICATION',
    keywords: [
      'augmentin',
      'amoxicillin clavulanate',
      'discharge prescription',
      'discharge antibiotic',
      'send home with antibiotic',
    ],
    excludeIf: ['allergic to augmentin', 'no augmentin'],
    confidence: 0.95,
    pillboxTitle: '[RX] Augmentin 875/125 mg PO BID × 7 days',
    pillboxDescription: 'E-prescription to pharmacy — diverticulitis treatment.',
    entities: { medication: 'Augmentin 875/125 mg', route: 'Oral', frequency: 'BID', duration: '7 days' }
  },

  {
    pillboxCategory: 'Prescription — Metoprolol (Beta Blocker)',
    intentType: 'ADD_MEDICATION',
    keywords: ['metoprolol', 'lopressor', 'beta blocker', 'start beta blocker'],
    confidence: 0.88,
    pillboxTitle: '[MED] Metoprolol — Beta Blocker',
    pillboxDescription: 'Confirm dose and frequency before prescribing.',
    entities: { medication: 'Metoprolol', route: 'Oral' }
  },

  {
    pillboxCategory: 'Prescription — Lisinopril (ACE Inhibitor)',
    intentType: 'ADD_MEDICATION',
    keywords: ['lisinopril', 'ace inhibitor', 'start lisinopril'],
    confidence: 0.88,
    pillboxTitle: '[MED] Lisinopril — ACE Inhibitor',
    pillboxDescription: 'Confirm dose for hypertension/heart failure management.',
    entities: { medication: 'Lisinopril', route: 'Oral' }
  },

  {
    pillboxCategory: 'Prescription Renewal / Refill',
    intentType: 'RENEW_PRESCRIPTION',
    keywords: ['refill', 'renew', 'renewal', 'needs more', 'continue the', 'keep on'],
    confidence: 0.84,
    pillboxTitle: '[RX] Prescription Renewal',
    pillboxDescription: 'Authorize refill for existing medication.',
    entities: { medication: '(spoken medication)' }
  },

  {
    pillboxCategory: 'Medication Discontinuation',
    intentType: 'DISCONTINUE_MEDICATION',
    keywords: [
      'discontinue',
      'stop the medication',
      'take her off',
      'take him off',
      'no longer needs',
      'd/c the',
      'hold the',
    ],
    confidence: 0.88,
    pillboxTitle: '[MED] Discontinue Medication',
    pillboxDescription: 'Mark medication as discontinued in active list.',
    entities: { medication: '(spoken medication)' }
  },

  // ── ALLERGIES ─────────────────────────────────────────────────
  {
    pillboxCategory: 'Allergy — Add New Allergy',
    intentType: 'ADD_ALLERGY',
    keywords: [
      'allergic to',
      'allergy to',
      'reaction to',
      'bad reaction',
      'hives from',
      'rash from',
      'anaphylaxis',
      'cant take',
      "can't take",
    ],
    confidence: 0.90,
    pillboxTitle: '[ALLERGY] Add Allergy to Record',
    pillboxDescription: 'Document new allergy — substance and reaction type.',
    entities: { substance: '(spoken substance)', reaction: '(spoken reaction)' }
  },

  {
    pillboxCategory: 'Allergy — Remove / Resolve Allergy',
    intentType: 'REMOVE_ALLERGY',
    keywords: [
      'not allergic',
      'no longer allergic',
      'allergy resolved',
      'tolerate it now',
      'can take it now',
    ],
    confidence: 0.78,
    pillboxTitle: '[ALLERGY] Resolve / Remove Allergy',
    pillboxDescription: 'Mark allergy as resolved in the patient record.',
    entities: { substance: '(spoken substance)' }
  },

  // ── VITAL SIGNS ───────────────────────────────────────────────
  {
    pillboxCategory: 'Vital Signs — Blood Pressure',
    intentType: 'RECORD_VITALS',
    keywords: ['blood pressure is', 'bp is', 'pressure of', 'systolic'],
    confidence: 0.92,
    pillboxTitle: '[VITALS] Record Blood Pressure',
    pillboxDescription: 'Commit BP reading to patient chart.',
    entities: { vitalType: 'Blood Pressure', value: '(spoken value)', unit: 'mmHg' }
  },

  {
    pillboxCategory: 'Vital Signs — Heart Rate',
    intentType: 'RECORD_VITALS',
    keywords: ['heart rate is', 'pulse is', 'bpm is', 'rate of'],
    confidence: 0.90,
    pillboxTitle: '[VITALS] Record Heart Rate',
    pillboxDescription: 'Commit heart rate to patient chart.',
    entities: { vitalType: 'Heart Rate', value: '(spoken value)', unit: 'bpm' }
  },

  {
    pillboxCategory: 'Vital Signs — Temperature',
    intentType: 'RECORD_VITALS',
    keywords: ['temperature is', 'temp is', 'febrile', 'afebrile', 'fever of'],
    confidence: 0.90,
    pillboxTitle: '[VITALS] Record Temperature',
    pillboxDescription: 'Commit temperature reading to patient chart.',
    entities: { vitalType: 'Temperature', value: '(spoken value)', unit: '°F' }
  },

  {
    pillboxCategory: 'Vital Signs — Oxygen Saturation',
    intentType: 'RECORD_VITALS',
    keywords: ['oxygen saturation', 'spo2', 'o2 sat', 'sat of', 'saturation is'],
    confidence: 0.90,
    pillboxTitle: '[VITALS] Record O₂ Saturation',
    pillboxDescription: 'Commit SpO₂ reading to patient chart.',
    entities: { vitalType: 'SpO2', value: '(spoken value)', unit: '%' }
  },

  // ── DIAGNOSIS / PROBLEM LIST ──────────────────────────────────
  {
    pillboxCategory: 'Diagnosis — Diverticulitis',
    intentType: 'INTENT_PROBLEM_ADD',
    keywords: [
      'diverticulitis',
      'sigmoid diverticulitis',
      'acute diverticulitis',
      'confirms diverticulitis',
      'diverticulitis of sigmoid',
    ],
    confidence: 0.95,
    pillboxTitle: '[DX] Diverticulitis of Sigmoid Colon (K57.32)',
    pillboxDescription: 'ICD-10-CM K57.32 — acute uncomplicated sigmoid diverticulitis.',
    entities: { dx: 'Diverticulitis of Sigmoid Colon', icdCode: 'K57.32' }
  },

  {
    pillboxCategory: 'Diagnosis — Hypertension',
    intentType: 'UPDATE_PROBLEM_LIST',
    keywords: ['hypertension', 'high blood pressure', 'htn'],
    confidence: 0.85,
    pillboxTitle: '[DX] Hypertension (I10)',
    pillboxDescription: 'Add essential hypertension to problem list.',
    entities: { condition: 'Hypertension', icdCode: 'I10' }
  },

  {
    pillboxCategory: 'Diagnosis — Type 2 Diabetes',
    intentType: 'UPDATE_PROBLEM_LIST',
    keywords: ['diabetes', 'type 2 diabetes', 'dm2', 't2dm', 'diabetic'],
    confidence: 0.85,
    pillboxTitle: '[DX] Type 2 Diabetes Mellitus (E11)',
    pillboxDescription: 'Add T2DM to active problem list.',
    entities: { condition: 'Type 2 Diabetes Mellitus', icdCode: 'E11' }
  },

  {
    pillboxCategory: 'Diagnosis — General / New Diagnosis',
    intentType: 'UPDATE_PROBLEM_LIST',
    keywords: [
      'diagnosed with',
      'new diagnosis',
      'assessment is',
      'confirmed diagnosis',
      'presenting with',
    ],
    confidence: 0.80,
    pillboxTitle: '[DX] Update Problem List',
    pillboxDescription: 'New or updated condition — confirm for FHIR problem list.',
    entities: { condition: '(spoken condition)' }
  },

  // ── CDS ALERT OVERRIDE ────────────────────────────────────────
  {
    pillboxCategory: 'CDS Override — Renal / Contrast Alert',
    intentType: 'INTENT_CDS_OVERRIDE',
    keywords: [
      'override renal alert',
      'override contrast warning',
      'override the alert',
      'override alert',
      'saline bolus complete',
      'surgical rule-out takes precedence',
      'renal caution',
    ],
    confidence: 0.97,
    pillboxTitle: '[WARN] Cr 1.3 mg/dL — Contrast Alert Override',
    pillboxDescription: 'Creatinine 1.3 mg/dL — confirm override rationale.',
    entities: { rationale: '1L NS bolus complete. Surgical rule-out takes precedence.' }
  },

  // ── NOTE ATTESTATION ──────────────────────────────────────────
  {
    pillboxCategory: 'Note Sign-Off — ED Attestation',
    intentType: 'INTENT_ATTEST_NOTE',
    keywords: [
      'attest note',
      'attest the note',
      'sign note',
      'sign and lock',
      'lock note',
      'provider sign-off',
      'co-sign',
      'cosign',
    ],
    confidence: 0.95,
    pillboxTitle: '[NOTE] ED Attestation & Provider Sign-Off',
    pillboxDescription: 'Cryptographically lock and sign the ED encounter note.',
    entities: { reassessment: 'Pain 2/10, tolerated oral fluids.' }
  },

  {
    pillboxCategory: 'Note — Update / Addendum',
    intentType: 'INTENT_ATTEST_NOTE',
    keywords: [
      'update ed course',
      'addendum',
      'update the note',
      'add to the note',
      'pain controlled',
      'reassessment at',
    ],
    confidence: 0.88,
    pillboxTitle: '[NOTE] Update ED Course / Addendum',
    pillboxDescription: 'Add reassessment note to active ED encounter.',
    entities: { reassessment: '(spoken update)' }
  },

  // ── REFERRALS ─────────────────────────────────────────────────
  {
    pillboxCategory: 'Referral — Surgery',
    intentType: 'ORDER_REFERRAL',
    keywords: ['refer to surgery', 'surgical consult', 'general surgery', 'colorectal surgery'],
    confidence: 0.88,
    pillboxTitle: '[REF] Surgical Consult',
    pillboxDescription: 'Refer to General Surgery for evaluation.',
    entities: { specialty: 'General Surgery' }
  },

  {
    pillboxCategory: 'Referral — GI / Gastroenterology',
    intentType: 'ORDER_REFERRAL',
    keywords: ['gastroenterology', 'gi referral', 'refer to gi', 'colonoscopy referral'],
    confidence: 0.88,
    pillboxTitle: '[REF] Gastroenterology Referral',
    pillboxDescription: 'Outpatient GI follow-up — colonoscopy in 6 weeks.',
    entities: { specialty: 'Gastroenterology', reason: 'Post-diverticulitis colonoscopy' }
  },

  {
    pillboxCategory: 'Referral — Cardiology',
    intentType: 'ORDER_REFERRAL',
    keywords: ['cardiology', 'cardiologist', 'refer to cardiology', 'cardiac referral'],
    confidence: 0.88,
    pillboxTitle: '[REF] Cardiology Referral',
    pillboxDescription: 'Refer to Cardiology for cardiac evaluation.',
    entities: { specialty: 'Cardiology' }
  },

  {
    pillboxCategory: 'Referral — Primary Care / Follow-Up',
    intentType: 'ORDER_REFERRAL',
    keywords: ['follow up with pcp', 'primary care follow-up', 'follow up in 48', 'see your doctor', 'see your primary'],
    confidence: 0.84,
    pillboxTitle: '[REF] PCP Follow-Up — 48 Hours',
    pillboxDescription: 'Schedule primary care follow-up within 48 hours of discharge.',
    entities: { specialty: 'Primary Care', reason: 'Post-ED discharge follow-up' }
  },

  // ── PROCEDURE SCHEDULING ──────────────────────────────────────
  {
    pillboxCategory: 'Procedure — Colonoscopy',
    intentType: 'SCHEDULE_PROCEDURE',
    keywords: ['colonoscopy', 'scope', 'bowel scope', 'colon scope', 'colonoscopy in 6 weeks'],
    confidence: 0.88,
    pillboxTitle: '[PROC] Schedule Colonoscopy',
    pillboxDescription: 'Outpatient colonoscopy — 6-week post-discharge follow-up.',
    entities: { procedure: 'Colonoscopy', timeframe: '6 weeks' }
  },

  {
    pillboxCategory: 'Procedure — IV Line / Access',
    intentType: 'SCHEDULE_PROCEDURE',
    keywords: ['iv line', 'iv access', 'start an iv', 'place an iv', 'peripheral iv'],
    confidence: 0.85,
    pillboxTitle: '[PROC] IV Access — Peripheral Line',
    pillboxDescription: 'Place peripheral IV for medication and fluid administration.',
    entities: { procedure: 'Peripheral IV Placement' }
  },

  // ── DISCHARGE DISPOSITION ─────────────────────────────────────
  {
    pillboxCategory: 'Discharge — Home (Routine)',
    intentType: 'INTENT_DISPOSITION',
    keywords: [
      'finalize discharge',
      'discharge home',
      'discharged home',
      'send her home',
      'send him home',
      'discharge patient',
      'discharge disposition',
      'ready to go home',
    ],
    excludeIf: ['not ready', 'cannot discharge', 'admit'],
    confidence: 0.98,
    pillboxTitle: '[DISP] Finalize Discharge — Home (Routine)',
    pillboxDescription: 'AVS print, discharge instructions, follow-up orders.',
    entities: { disp: 'Home (Routine)' }
  },

];

// ============================================================
// Lookup helper — finds the FIRST matching trigger for a transcript
// Returns null if no keyword matches.
// ============================================================
export function findTrigger(transcript: string): KeywordTrigger | null {
  const normalized = transcript.toLowerCase().trim();

  for (const trigger of KEYWORD_TRIGGER_MAP) {
    // Check exclusions first — skip if any exclude term is present
    if (trigger.excludeIf?.some(ex => normalized.includes(ex))) {
      continue;
    }

    // Check keywords — return first full match
    const matched = trigger.keywords.some(kw => normalized.includes(kw));
    if (matched) {
      return trigger;
    }
  }

  return null;
}

// ============================================================
// Multi-match helper — finds ALL matching triggers (for batch display)
// ============================================================
export function findAllTriggers(transcript: string): KeywordTrigger[] {
  const normalized = transcript.toLowerCase().trim();
  const seen = new Set<string>();
  const results: KeywordTrigger[] = [];

  for (const trigger of KEYWORD_TRIGGER_MAP) {
    // Skip already matched intent types (one pillbox per intent type)
    if (seen.has(trigger.intentType)) continue;

    if (trigger.excludeIf?.some(ex => normalized.includes(ex))) continue;

    if (trigger.keywords.some(kw => normalized.includes(kw))) {
      seen.add(trigger.intentType);
      results.push(trigger);
    }
  }

  return results;
}
