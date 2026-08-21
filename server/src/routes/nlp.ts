// ============================================================
// NLP Routes — Keyword-Map-Driven Intent Dispatch
// ============================================================
// Uses the same keyword trigger map as the client-side engine.
// One keyword heard → one specific pillbox. No fan-out.
// ============================================================

import { Router } from 'express';

export const nlpRouter = Router();

interface AnalyzeRequest {
  transcript: string;
  patientId: string;
  patientName: string;
}

// ============================================================
// Server-side keyword trigger table
// Mirrors src/nlp/keywordTriggerMap.ts (kept in sync manually)
// ============================================================
interface ServerKeywordTrigger {
  intentType: string;
  keywords: string[];
  excludeIf?: string[];
  confidence: number;
  entities: Record<string, string>;
  fhirResourceType?: string;
}

const SERVER_KEYWORD_MAP: ServerKeywordTrigger[] = [
  // Patient identity / demographics
  {
    intentType: 'UPDATE_ADDRESS',
    keywords: ['hello mrs davis', 'hello mrs. davis', 'hi mrs davis', 'hi mrs. davis',
      'good morning mrs davis', 'good morning mrs. davis', 'mrs davis'],
    confidence: 0.90,
    entities: { address: '742 Evergreen Terrace', addressFlag: 'VERIFY_ON_ARRIVAL' }
  },
  {
    intentType: 'UPDATE_ADDRESS',
    keywords: ['new address', 'moved to', 'i live at', 'my address is', 'address changed', 'living at', 'relocated to'],
    confidence: 0.85,
    entities: { address: '(spoken address)' }
  },
  {
    intentType: 'UPDATE_PHONE',
    keywords: ['new phone number', 'call me at', 'my number is', 'phone changed', 'reach me at', 'contact number', 'cell is', 'mobile is'],
    confidence: 0.82,
    entities: { phone: '(spoken number)' }
  },
  {
    intentType: 'UPDATE_INSURANCE',
    keywords: ['new insurance', 'switched insurance', 'changed insurance', 'insurance is now', 'covered by', 'policy number'],
    confidence: 0.78,
    entities: { carrier: '(spoken carrier)' }
  },

  // Lab orders — specific tests first, then panels
  {
    intentType: 'INTENT_ORDER_LAB',
    keywords: ['cbc', 'complete blood count'],
    excludeIf: ['cancel', 'no cbc'],
    confidence: 0.96,
    entities: { panel: 'CBC', priority: 'stat' },
    fhirResourceType: 'ServiceRequest'
  },
  {
    intentType: 'INTENT_ORDER_LAB',
    keywords: ['cmp', 'comprehensive metabolic', 'metabolic panel'],
    excludeIf: ['cancel', 'no cmp'],
    confidence: 0.96,
    entities: { panel: 'CMP', priority: 'stat' },
    fhirResourceType: 'ServiceRequest'
  },
  {
    intentType: 'INTENT_ORDER_LAB',
    keywords: ['acute abdominal lab', 'acute lab panel', 'abdominal lab panel', 'lab panel',
      'lipase', 'lactate', 'cbc cmp', 'order labs', 'draw labs', 'run labs', 'blood work', 'lab work'],
    excludeIf: ['cancel', 'no labs'],
    confidence: 0.93,
    entities: { panel: 'Acute Abdominal Panel', priority: 'stat' },
    fhirResourceType: 'ServiceRequest'
  },
  {
    intentType: 'ORDER_LAB',
    keywords: ['a1c', 'hba1c', 'hemoglobin a1c'],
    confidence: 0.90,
    entities: { labTest: 'HbA1c', priority: 'routine' }
  },
  {
    intentType: 'ORDER_LAB',
    keywords: ['lipid panel', 'cholesterol', 'ldl', 'hdl', 'triglycerides'],
    confidence: 0.90,
    entities: { labTest: 'Lipid Panel', priority: 'routine' }
  },
  {
    intentType: 'ORDER_LAB',
    keywords: ['tsh', 'thyroid', 'thyroid function'],
    confidence: 0.90,
    entities: { labTest: 'TSH', priority: 'routine' }
  },
  {
    intentType: 'ORDER_LAB',
    keywords: ['troponin', 'bnp', 'ck-mb', 'cardiac markers'],
    confidence: 0.94,
    entities: { labTest: 'Troponin', priority: 'stat' }
  },
  {
    intentType: 'ORDER_LAB',
    keywords: ['urinalysis', 'urine culture', 'ua and culture', 'urine test'],
    confidence: 0.90,
    entities: { labTest: 'Urinalysis', priority: 'routine' }
  },
  {
    intentType: 'ORDER_LAB',
    keywords: ['inr', 'prothrombin', 'coagulation panel'],
    confidence: 0.90,
    entities: { labTest: 'INR/PT/PTT', priority: 'routine' }
  },

  // Imaging orders
  {
    intentType: 'INTENT_ORDER_IMAGING',
    keywords: ['ct abdomen', 'ct scan abdomen', 'ct of the abdomen', 'ct abd pelvis',
      'ct abdomen and pelvis', 'ct with iv contrast', 'queue a ct', 'order a ct'],
    excludeIf: ['cancel', 'no ct'],
    confidence: 0.97,
    entities: { study: 'CT Abdomen and Pelvis', contrast: 'IV', cpt: '74177' },
    fhirResourceType: 'ServiceRequest'
  },
  {
    intentType: 'ORDER_IMAGING',
    keywords: ['ct chest', 'chest ct', 'pulmonary embolism ct', 'pe protocol'],
    confidence: 0.94,
    entities: { study: 'CT Chest', protocol: 'PE protocol' }
  },
  {
    intentType: 'ORDER_IMAGING',
    keywords: ['mri', 'magnetic resonance'],
    confidence: 0.92,
    entities: { study: 'MRI', bodyPart: '(spoken region)' }
  },
  {
    intentType: 'ORDER_IMAGING',
    keywords: ['ultrasound', 'us abdomen', 'abdominal ultrasound', 'ruq ultrasound', 'pelvic ultrasound'],
    confidence: 0.92,
    entities: { study: 'Ultrasound', bodyPart: 'Abdomen' }
  },
  {
    intentType: 'ORDER_IMAGING',
    keywords: ['chest x-ray', 'cxr', 'chest xray', 'x-ray chest', 'portable cxr'],
    confidence: 0.92,
    entities: { study: 'X-Ray', bodyPart: 'Chest' }
  },
  {
    intentType: 'ORDER_IMAGING',
    keywords: ['echo', 'echocardiogram', 'tte', 'cardiac echo'],
    confidence: 0.90,
    entities: { study: 'Echo', bodyPart: 'Heart' }
  },

  // Medications
  {
    intentType: 'INTENT_ORDER_MEDICATION',
    keywords: ['morphine', 'iv morphine', '4mg morphine'],
    excludeIf: ['discontinue', 'stop morphine', 'cancel'],
    confidence: 0.95,
    entities: { medication: 'Morphine', dose: '4 mg', route: 'IV', frequency: 'STAT' },
    fhirResourceType: 'MedicationRequest'
  },
  {
    intentType: 'INTENT_ORDER_MEDICATION',
    keywords: ['normal saline', 'saline bolus', 'one liter saline', '1l normal saline', 'iv fluids', 'iv hydration'],
    excludeIf: ['discontinue', 'stop saline'],
    confidence: 0.93,
    entities: { medication: 'Normal Saline', dose: '1000 mL', route: 'IV' },
    fhirResourceType: 'MedicationRequest'
  },
  {
    intentType: 'INTENT_ORDER_MEDICATION',
    keywords: ['augmentin', 'amoxicillin clavulanate', 'discharge prescription', 'discharge antibiotic'],
    excludeIf: ['allergic to augmentin', 'no augmentin'],
    confidence: 0.95,
    entities: { medication: 'Augmentin 875/125 mg', route: 'Oral', frequency: 'BID', duration: '7 days' },
    fhirResourceType: 'MedicationRequest'
  },
  {
    intentType: 'ADD_MEDICATION',
    keywords: ['metoprolol', 'lopressor', 'beta blocker', 'start beta blocker'],
    confidence: 0.88,
    entities: { medication: 'Metoprolol', route: 'Oral' }
  },
  {
    intentType: 'ADD_MEDICATION',
    keywords: ['lisinopril', 'ace inhibitor', 'start lisinopril'],
    confidence: 0.88,
    entities: { medication: 'Lisinopril', route: 'Oral' }
  },
  {
    intentType: 'RENEW_PRESCRIPTION',
    keywords: ['refill', 'renew', 'renewal', 'needs more', 'continue the', 'keep on'],
    confidence: 0.84,
    entities: { medication: '(spoken medication)' }
  },
  {
    intentType: 'DISCONTINUE_MEDICATION',
    keywords: ['discontinue', 'stop the medication', 'take her off', 'take him off', 'no longer needs', 'd/c the', 'hold the'],
    confidence: 0.88,
    entities: { medication: '(spoken medication)' }
  },

  // Allergies
  {
    intentType: 'ADD_ALLERGY',
    keywords: ['allergic to', 'allergy to', 'reaction to', 'bad reaction', 'hives from', 'rash from', 'anaphylaxis', "can't take"],
    confidence: 0.90,
    entities: { substance: '(spoken substance)', reaction: '(spoken reaction)' }
  },
  {
    intentType: 'REMOVE_ALLERGY',
    keywords: ['not allergic', 'no longer allergic', 'allergy resolved', 'tolerate it now', 'can take it now'],
    confidence: 0.78,
    entities: { substance: '(spoken substance)' }
  },

  // Vitals
  {
    intentType: 'RECORD_VITALS',
    keywords: ['blood pressure is', 'bp is', 'pressure of', 'systolic'],
    confidence: 0.92,
    entities: { vitalType: 'Blood Pressure', value: '(spoken value)', unit: 'mmHg' }
  },
  {
    intentType: 'RECORD_VITALS',
    keywords: ['heart rate is', 'pulse is', 'bpm is'],
    confidence: 0.90,
    entities: { vitalType: 'Heart Rate', value: '(spoken value)', unit: 'bpm' }
  },
  {
    intentType: 'RECORD_VITALS',
    keywords: ['temperature is', 'temp is', 'febrile', 'afebrile', 'fever of'],
    confidence: 0.90,
    entities: { vitalType: 'Temperature', value: '(spoken value)', unit: '°F' }
  },
  {
    intentType: 'RECORD_VITALS',
    keywords: ['oxygen saturation', 'spo2', 'o2 sat', 'saturation is'],
    confidence: 0.90,
    entities: { vitalType: 'SpO2', value: '(spoken value)', unit: '%' }
  },

  // Diagnosis
  {
    intentType: 'INTENT_PROBLEM_ADD',
    keywords: ['diverticulitis', 'sigmoid diverticulitis', 'acute diverticulitis'],
    confidence: 0.95,
    entities: { dx: 'Diverticulitis of Sigmoid Colon', icdCode: 'K57.32' }
  },
  {
    intentType: 'UPDATE_PROBLEM_LIST',
    keywords: ['hypertension', 'high blood pressure', 'htn'],
    confidence: 0.85,
    entities: { condition: 'Hypertension', icdCode: 'I10' }
  },
  {
    intentType: 'UPDATE_PROBLEM_LIST',
    keywords: ['diabetes', 'type 2 diabetes', 'dm2', 't2dm'],
    confidence: 0.85,
    entities: { condition: 'Type 2 Diabetes Mellitus', icdCode: 'E11' }
  },
  {
    intentType: 'UPDATE_PROBLEM_LIST',
    keywords: ['diagnosed with', 'new diagnosis', 'assessment is', 'confirmed diagnosis', 'presenting with'],
    confidence: 0.80,
    entities: { condition: '(spoken condition)' }
  },

  // CDS Override
  {
    intentType: 'INTENT_CDS_OVERRIDE',
    keywords: ['override renal alert', 'override contrast warning', 'override the alert',
      'override alert', 'saline bolus complete', 'renal caution'],
    confidence: 0.97,
    entities: { rationale: '1L NS bolus complete. Surgical rule-out takes precedence.' }
  },

  // Note attestation
  {
    intentType: 'INTENT_ATTEST_NOTE',
    keywords: ['attest note', 'attest the note', 'sign note', 'sign and lock', 'lock note', 'provider sign-off', 'cosign'],
    confidence: 0.95,
    entities: { reassessment: 'Pain 2/10, tolerated oral fluids.' }
  },
  {
    intentType: 'INTENT_ATTEST_NOTE',
    keywords: ['update ed course', 'addendum', 'update the note', 'pain controlled', 'reassessment at'],
    confidence: 0.88,
    entities: { reassessment: '(spoken update)' }
  },

  // Referrals
  {
    intentType: 'ORDER_REFERRAL',
    keywords: ['refer to surgery', 'surgical consult', 'general surgery', 'colorectal surgery'],
    confidence: 0.88,
    entities: { specialty: 'General Surgery' }
  },
  {
    intentType: 'ORDER_REFERRAL',
    keywords: ['gastroenterology', 'gi referral', 'refer to gi', 'colonoscopy referral'],
    confidence: 0.88,
    entities: { specialty: 'Gastroenterology', reason: 'Post-diverticulitis colonoscopy' }
  },
  {
    intentType: 'ORDER_REFERRAL',
    keywords: ['cardiology', 'cardiologist', 'refer to cardiology'],
    confidence: 0.88,
    entities: { specialty: 'Cardiology' }
  },
  {
    intentType: 'ORDER_REFERRAL',
    keywords: ['follow up with pcp', 'primary care follow-up', 'follow up in 48', 'see your primary'],
    confidence: 0.84,
    entities: { specialty: 'Primary Care', reason: 'Post-ED discharge follow-up' }
  },

  // Procedures
  {
    intentType: 'SCHEDULE_PROCEDURE',
    keywords: ['colonoscopy', 'colonoscopy in 6 weeks'],
    confidence: 0.88,
    entities: { procedure: 'Colonoscopy', timeframe: '6 weeks' }
  },
  {
    intentType: 'SCHEDULE_PROCEDURE',
    keywords: ['iv line', 'iv access', 'start an iv', 'place an iv', 'peripheral iv'],
    confidence: 0.85,
    entities: { procedure: 'Peripheral IV Placement' }
  },

  // Discharge
  {
    intentType: 'INTENT_DISPOSITION',
    keywords: ['finalize discharge', 'discharge home', 'discharged home', 'send her home',
      'send him home', 'discharge patient', 'discharge disposition', 'ready to go home'],
    excludeIf: ['not ready', 'cannot discharge', 'admit'],
    confidence: 0.98,
    entities: { disp: 'Home (Routine)' }
  },
];

/** Match transcript against the keyword map — returns matched intents */
function matchKeywords(transcript: string, patientId: string, patientName: string): any[] {
  const normalized = transcript.toLowerCase().trim();
  const seen = new Set<string>();
  const results: any[] = [];
  const now = new Date().toISOString();

  for (const trigger of SERVER_KEYWORD_MAP) {
    if (seen.has(trigger.intentType)) continue;
    if (trigger.excludeIf?.some(ex => normalized.includes(ex))) continue;
    if (!trigger.keywords.some(kw => normalized.includes(kw))) continue;

    seen.add(trigger.intentType);

    const intent: any = {
      type: trigger.intentType,
      confidence: trigger.confidence,
      sourceText: transcript,
      extractedEntities: { ...trigger.entities },
      timestamp: now
    };

    // Attach FHIR payload for clinical order types
    if (trigger.fhirResourceType === 'ServiceRequest' && trigger.intentType === 'INTENT_ORDER_LAB') {
      intent.fhirResourceType = 'ServiceRequest';
      intent.fhirPayload = {
        resourceType: 'ServiceRequest',
        id: `sr-lab-${Date.now()}`,
        status: 'active',
        intent: 'order',
        priority: 'stat',
        code: { text: trigger.entities.panel ?? 'Lab Panel' },
        subject: { reference: `Patient/${patientId}`, display: patientName }
      };
    } else if (trigger.fhirResourceType === 'ServiceRequest' && trigger.intentType === 'INTENT_ORDER_IMAGING') {
      intent.fhirResourceType = 'ServiceRequest';
      intent.fhirPayload = {
        resourceType: 'ServiceRequest',
        id: `sr-rad-${Date.now()}`,
        status: 'active',
        intent: 'order',
        code: { coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: trigger.entities.cpt ?? '74177', display: trigger.entities.study ?? 'Imaging' }] },
        subject: { reference: `Patient/${patientId}`, display: patientName }
      };
    } else if (trigger.fhirResourceType === 'MedicationRequest') {
      intent.fhirResourceType = 'MedicationRequest';
      intent.fhirPayload = {
        resourceType: 'MedicationRequest',
        id: `medrx-${Date.now()}`,
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: { text: trigger.entities.medication ?? 'Medication' },
        subject: { reference: `Patient/${patientId}`, display: patientName }
      };
    }

    results.push(intent);
  }

  return results;
}

nlpRouter.post('/analyze', (req, res) => {
  const { transcript = '', patientId = 'pt-001', patientName = 'Margaret Davis' } = req.body as AnalyzeRequest;

  const intents = matchKeywords(transcript, patientId, patientName);

  if (intents.length > 0) {
    console.log(`[Server NLP] "${transcript.substring(0, 60)}" → ${intents.map(i => i.type).join(', ')}`);
  } else {
    console.log(`[Server NLP] No keyword match for: "${transcript.substring(0, 60)}"`);
  }

  res.json({ intents });
});
