// ============================================================
// Action Resolver — Intent → Pillbox Action Mapper
// ============================================================
// Transforms ClinicalIntents from the NLP engine into concrete
// PillboxAction objects with alternatives for the clinician.

import type {
  ClinicalIntent,
  ClinicalIntentType,
  PillboxAction,
  PillboxAlternative,
  PatientRecord
} from '../types';
import { INTENT_PATTERNS } from '../nlp/intentPatterns';

/**
 * Resolve a batch of clinical intents into UI-ready pillbox actions.
 */
export function resolveIntents(
  intents: ClinicalIntent[],
  patient: PatientRecord
): PillboxAction[] {
  return intents.map(intent => resolveIntent(intent, patient));
}

function resolveIntent(
  intent: ClinicalIntent,
  patient: PatientRecord
): PillboxAction {
  const pattern = INTENT_PATTERNS.find(p => p.type === intent.type);
  const now = new Date().toISOString();

  // Build description from extracted entities
  let description = pattern?.descriptionTemplate ?? intent.type;
  for (const [key, value] of Object.entries(intent.extractedEntities)) {
    description = description.replace(`{{${key}}}`, value);
  }
  description = description.replace(/\{\{[^}]+\}\}/g, '(unspecified)');

  const alternatives = buildAlternatives(intent, patient);

  return {
    id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    intentType: intent.type,
    status: 'PENDING',
    title: pattern?.actionLabel ?? formatIntentType(intent.type),
    description,
    sourceText: intent.sourceText,
    confidence: intent.confidence,
    createdAt: now,
    alternatives,
    ehrEndpoint: pattern?.ehrEndpoint ?? '',
    ehrMethod: pattern?.ehrMethod ?? 'POST'
  };
}

/**
 * Build the alternative pillbox buttons for a given intent.
 * Most intents produce 2-3 alternatives depending on clinical context.
 */
function buildAlternatives(
  intent: ClinicalIntent,
  patient: PatientRecord
): PillboxAlternative[] {
  const e = intent.extractedEntities;

  switch (intent.type) {
    case 'UPDATE_ADDRESS':
      return [
        {
          id: `alt-${intent.id}-spoken`,
          label: e.address ?? 'Spoken Address',
          description: 'Accept address from patient dialogue',
          icon: 'Sparkles',
          variant: 'primary',
          isRecommended: true,
          payload: { address: e.address, addressFlag: undefined }
        },
        {
          id: `alt-${intent.id}-keep`,
          label: patient.address,
          description: 'Keep existing EHR registered address',
          icon: 'Building',
          variant: 'primary',
          isRecommended: false,
          payload: { address: patient.address }
        },
        {
          id: `alt-${intent.id}-flag`,
          label: 'Flag for Manual Review',
          description: 'Route to registration desk for verification',
          icon: 'Flag',
          variant: 'warning',
          isRecommended: false,
          payload: { addressFlag: 'FLAGGED_FOR_MANUAL_REVIEW' }
        }
      ];

    case 'ADD_ALLERGY':
      return [
        {
          id: `alt-${intent.id}-add`,
          label: `Add ${e.substance ?? 'Allergy'}`,
          description: `Document ${e.reaction ? e.reaction + ' reaction' : 'allergy'} (Active)`,
          icon: 'ShieldAlert',
          variant: 'primary',
          isRecommended: true,
          payload: {
            substance: e.substance ?? 'Unknown',
            reaction: e.reaction ?? 'Unknown',
            severity: 'moderate',
            status: 'Active'
          }
        },
        {
          id: `alt-${intent.id}-keep`,
          label: 'Keep Current Allergy Profile',
          description: `Retain: ${patient.allergies.map(a => a.substance).join(', ')}`,
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        },
        {
          id: `alt-${intent.id}-pharmacy`,
          label: 'Route to Pharmacy Reconciliation',
          description: 'Flag for inpatient pharmacist review',
          icon: 'Flag',
          variant: 'warning',
          isRecommended: false,
          payload: {
            substance: e.substance ?? 'Unknown',
            reaction: e.reaction ?? 'Unknown',
            status: 'PENDING_PHARMACY_RECONCILIATION'
          }
        }
      ];

    case 'REMOVE_ALLERGY':
      return [
        {
          id: `alt-${intent.id}-remove`,
          label: `Mark ${e.substance ?? 'Allergy'} as Resolved`,
          description: 'Update allergy status to resolved',
          icon: 'CheckCircle',
          variant: 'success',
          isRecommended: true,
          payload: { substance: e.substance, status: 'resolved' }
        }
      ];

    // --- Margaret Davis Deictic CPOE & Workflow Cases ---
    case 'INTENT_ORDER_LAB':
      return [
        {
          id: `alt-${intent.id}-labs-stat`,
          label: '[LAB] CBC, CMP, Lipase, Lactate STAT',
          description: 'Dispatch acute abdominal panel to labSTAT',
          icon: 'Activity',
          variant: 'primary',
          isRecommended: true,
          payload: { labGroup: 'Acute Abdominal Panel', priority: 'stat' },
          fhirResourceType: 'ServiceRequest',
          fhirPayload: {
            resourceType: 'ServiceRequest',
            id: `sr-lab-abdpain-${patient.id}`,
            status: 'active',
            intent: 'order',
            category: [{ coding: [{ system: 'http://snomed.info/sct', code: '108252004', display: 'Laboratory procedure' }] }],
            code: { coding: [{ system: 'http://loinc.org', code: 'L-ABDPANEL', display: 'Acute Abdominal Lab Panel (CBC, CMP, Lipase, Lactate)' }] },
            subject: { reference: `Patient/${patient.id}`, display: patient.name },
            priority: 'stat'
          }
        },
        {
          id: `alt-${intent.id}-labs-routine`,
          label: 'Stage Routine Abdominal Labs',
          description: 'Routine priority lab collection',
          icon: 'Clock',
          variant: 'primary',
          isRecommended: false,
          payload: { labGroup: 'Acute Abdominal Panel', priority: 'routine' }
        }
      ];

    case 'INTENT_ORDER_IMAGING':
      return [
        {
          id: `alt-${intent.id}-ct-iv`,
          label: '[RAD] CT Abdomen & Pelvis W/ IV Contrast',
          description: 'CPT 74177 • Protocol: IV Contrast • Reason: LLQ Pain',
          icon: 'FileText',
          variant: 'primary',
          isRecommended: true,
          payload: { study: 'CT Abdomen and Pelvis', contrast: 'IV', cpt: '74177' },
          fhirResourceType: 'ServiceRequest',
          fhirPayload: {
            resourceType: 'ServiceRequest',
            id: 'sr-ct-abdpelv-001',
            status: 'active',
            intent: 'order',
            category: [{ coding: [{ system: 'http://snomed.info/sct', code: '363679005', display: 'Imaging' }] }],
            code: {
              coding: [{ system: 'http://www.ama-assn.org/go/cpt', code: '74177', display: 'Computed tomography, abdomen and pelvis; with contrast material(s)' }],
              text: 'CT Abdomen and Pelvis with IV Contrast'
            },
            subject: { reference: `Patient/${patient.id}`, display: patient.name },
            encounter: { reference: 'Encounter/ed-20260820-042' },
            reasonCode: [{ coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'R10.32', display: 'Left lower quadrant pain' }] }]
          }
        },
        {
          id: `alt-${intent.id}-ct-po`,
          label: 'CT Abdomen & Pelvis PO/IV Dual Contrast',
          description: 'CPT 74177 • Protocol: PO + IV Dual Contrast',
          icon: 'FileText',
          variant: 'primary',
          isRecommended: false,
          payload: { study: 'CT Abdomen and Pelvis', contrast: 'PO_IV', cpt: '74177' }
        },
        {
          id: `alt-${intent.id}-us`,
          label: 'US Abdomen Complete (Alternative)',
          description: 'Non-radiation ultrasound alternative',
          icon: 'Activity',
          variant: 'warning',
          isRecommended: false,
          payload: { study: 'Ultrasound Abdomen Complete', contrast: 'NONE' }
        }
      ];

    case 'INTENT_ORDER_MEDICATION':
      return [
        {
          id: `alt-${intent.id}-meds-stat`,
          label: '1L Normal Saline + 4mg Morphine IV STAT',
          description: 'Dispatch Stat IV Hydration & Analgesia',
          icon: 'Pill',
          variant: 'primary',
          isRecommended: true,
          payload: { orders: ['Normal Saline 1000 mL IV', 'Morphine 4 mg IV Push STAT'] },
          fhirResourceType: 'MedicationRequest',
          fhirPayload: {
            resourceType: 'MedicationRequest',
            id: 'medrx-saline-morphine-001',
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: { text: 'Normal Saline 1000 mL IV + Morphine 4mg IV STAT' },
            subject: { reference: `Patient/${patient.id}`, display: patient.name }
          }
        },
        {
          id: `alt-${intent.id}-augmentin`,
          label: 'Augmentin 875/125 mg PO BID x 7 Days',
          description: 'Stage E-Prescription to Walgreens 4th St',
          icon: 'Pill',
          variant: 'primary',
          isRecommended: true,
          payload: { medication: 'Augmentin 875/125 mg', route: 'Oral', frequency: 'BID', duration: '7 days' },
          fhirResourceType: 'MedicationRequest',
          fhirPayload: {
            resourceType: 'MedicationRequest',
            id: 'medrx-augmentin-002',
            status: 'active',
            intent: 'order',
            medicationCodeableConcept: {
              coding: [{ system: 'http://www.nlm.nih.gov/research/umls/rxnorm', code: '106258', display: 'Amoxicillin 875 MG / Clavulanate Potassium 125 MG Oral Tablet' }]
            },
            subject: { reference: `Patient/${patient.id}`, display: patient.name },
            dosageInstruction: [{
              text: '1 tablet orally every 12 hours for 7 days with meals',
              timing: { repeat: { frequency: 2, period: 1, periodUnit: 'd' } },
              route: { coding: [{ system: 'http://snomed.info/sct', code: '260548002', display: 'Oral' }] },
              doseAndRate: [{ doseQuantity: { value: 1, unit: 'TAB' } }]
            }],
            dispenseRequest: { quantity: { value: 14, unit: 'TAB' }, numberOfRepeatsAllowed: 0 }
          }
        }
      ];

    case 'INTENT_CDS_OVERRIDE':
      return [
        {
          id: `alt-${intent.id}-override`,
          label: 'Override Renal Alert (Saline Complete)',
          description: '1L NS bolus complete • Surgical rule-out takes precedence',
          icon: 'ShieldAlert',
          variant: 'warning',
          isRecommended: true,
          payload: { overrideReason: 'Hydrated with 1L NS. Surgical rule-out takes precedence.', alertId: 'CDS-RENAL-CR13' }
        },
        {
          id: `alt-${intent.id}-cancel-contrast`,
          label: 'Switch to Non-Contrast CT Abdomen',
          description: 'Cancel IV contrast protocol due to Cr 1.3 mg/dL',
          icon: 'XCircle',
          variant: 'danger',
          isRecommended: false,
          payload: { contrast: 'NONE' }
        }
      ];

    case 'INTENT_PROBLEM_ADD':
      return [
        {
          id: `alt-${intent.id}-diverticulitis`,
          label: 'Add Sigmoid Diverticulitis (K57.32)',
          description: 'ICD-10-CM K57.32 • Acute uncomplicated sigmoid diverticulitis',
          icon: 'Heart',
          variant: 'primary',
          isRecommended: true,
          payload: { condition: 'Diverticulitis of Sigmoid Colon', icdCode: 'K57.32', status: 'active' },
          fhirResourceType: 'Condition',
          fhirPayload: {
            resourceType: 'Condition',
            id: 'cond-diverticulitis-003',
            clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
            verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'confirmed' }] },
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-category', code: 'encounter-diagnosis' }] }],
            code: {
              coding: [{ system: 'http://hl7.org/fhir/sid/icd-10-cm', code: 'K57.32', display: 'Diverticulitis of large intestine without perforation or abscess without bleeding' }],
              text: 'Acute uncomplicated sigmoid diverticulitis'
            },
            subject: { reference: `Patient/${patient.id}`, display: patient.name },
            recordedDate: new Date().toISOString()
          }
        }
      ];

    case 'INTENT_ATTEST_NOTE':
      return [
        {
          id: `alt-${intent.id}-attest`,
          label: 'Attest ED Note & Sign Provider Record',
          description: 'Cryptographically lock note • Reassessment @ 12:45 PM',
          icon: 'Sparkles',
          variant: 'success',
          isRecommended: true,
          payload: { noteStatus: 'ATTESTED', provider: 'Patel, MD (#49102)', timestamp: new Date().toISOString() }
        }
      ];

    case 'INTENT_DISPOSITION':
      return [
        {
          id: `alt-${intent.id}-discharge`,
          label: 'Finalize Discharge & Print AVS',
          description: 'Discharge Home • 48h PCP Follow-up • Colonoscopy 6wks',
          icon: 'UserPlus',
          variant: 'success',
          isRecommended: true,
          payload: { disposition: 'Home', avsStatus: 'PRINTED', status: 'finished' },
          fhirResourceType: 'Encounter',
          fhirPayload: {
            resourceType: 'Encounter',
            id: 'ed-20260820-042',
            status: 'finished',
            class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'EMER', display: 'Emergency' },
            subject: { reference: `Patient/${patient.id}`, display: patient.name },
            hospitalization: {
              dischargeDisposition: {
                coding: [{ system: 'http://terminology.hl7.org/CodeSystem/discharge-disposition', code: 'home', display: 'Home' }],
                text: 'Discharged home with outpatient follow-up'
              }
            },
            period: { start: '2026-08-20T10:15:00-04:00', end: new Date().toISOString() }
          }
        }
      ];


    case 'ORDER_LAB':
      return [
        {
          id: `alt-${intent.id}-sign`,
          label: `Order ${e.labTest ?? 'Lab Test'}`,
          description: `Sign and submit ${e.urgency ?? 'routine'} lab order`,
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: true,
          payload: {
            name: e.labTest ?? 'Lab Test',
            type: 'lab',
            status: 'SIGNED',
            urgency: e.urgency ?? 'routine'
          }
        },
        {
          id: `alt-${intent.id}-stage`,
          label: 'Stage for Later Review',
          description: 'Queue order for signing at workstation',
          icon: 'Clock',
          variant: 'warning',
          isRecommended: false,
          payload: {
            name: e.labTest ?? 'Lab Test',
            type: 'lab',
            status: 'STAGED',
            urgency: e.urgency ?? 'routine'
          }
        }
      ];

    case 'ORDER_IMAGING':
      return [
        {
          id: `alt-${intent.id}-sign`,
          label: `Order ${e.study ?? 'Imaging'} ${e.bodyPart ?? ''}`.trim(),
          description: `Sign ${e.protocol ?? ''} imaging order`.trim(),
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: true,
          payload: {
            name: `${e.study ?? 'Imaging'} ${e.bodyPart ?? ''}`.trim(),
            type: 'imaging',
            status: 'SIGNED',
            details: e.protocol
          }
        },
        {
          id: `alt-${intent.id}-stage`,
          label: 'Stage for Later Review',
          description: 'Queue imaging order for signing',
          icon: 'Clock',
          variant: 'warning',
          isRecommended: false,
          payload: {
            name: `${e.study ?? 'Imaging'} ${e.bodyPart ?? ''}`.trim(),
            type: 'imaging',
            status: 'STAGED',
            details: e.protocol
          }
        }
      ];

    case 'ORDER_REFERRAL':
      return [
        {
          id: `alt-${intent.id}-sign`,
          label: `Refer to ${e.specialty ?? 'Specialist'}`,
          description: e.reason ? `Reason: ${e.reason}` : 'Submit referral',
          icon: 'UserPlus',
          variant: 'primary',
          isRecommended: true,
          payload: {
            name: `Referral: ${e.specialty ?? 'Specialist'}`,
            type: 'referral',
            status: 'SIGNED',
            details: e.reason
          }
        },
        {
          id: `alt-${intent.id}-cancel`,
          label: 'Cancel Referral',
          description: 'Do not submit referral',
          icon: 'XCircle',
          variant: 'danger',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'RECORD_VITALS':
      return [
        {
          id: `alt-${intent.id}-record`,
          label: `Record ${e.vitalType ?? 'Vital'}: ${e.value ?? '—'}`,
          description: `Commit vital sign to patient chart`,
          icon: 'Heart',
          variant: 'primary',
          isRecommended: true,
          payload: {
            type: e.vitalType,
            value: e.value,
            unit: e.unit ?? '',
            recordedAt: new Date().toISOString()
          }
        },
        {
          id: `alt-${intent.id}-skip`,
          label: 'Skip / Already Recorded',
          description: 'Vital sign already in chart or not applicable',
          icon: 'SkipForward',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'ADD_MEDICATION':
      return [
        {
          id: `alt-${intent.id}-prescribe`,
          label: `Prescribe ${e.medication ?? 'Medication'}`,
          description: `${e.dosage ?? ''} ${e.route ?? 'oral'}`.trim(),
          icon: 'PlusCircle',
          variant: 'primary',
          isRecommended: true,
          payload: {
            name: e.medication ?? 'Medication',
            dosage: e.dosage ?? '',
            route: e.route ?? 'oral',
            frequency: '',
            status: 'active'
          }
        },
        {
          id: `alt-${intent.id}-stage`,
          label: 'Stage for Pharmacy Review',
          description: 'Queue for pharmacist verification',
          icon: 'Clock',
          variant: 'warning',
          isRecommended: false,
          payload: {
            name: e.medication ?? 'Medication',
            dosage: e.dosage ?? '',
            route: e.route ?? 'oral',
            frequency: '',
            status: 'pending'
          }
        }
      ];

    case 'DISCONTINUE_MEDICATION':
      return [
        {
          id: `alt-${intent.id}-dc`,
          label: `Discontinue ${e.medication ?? 'Medication'}`,
          description: 'Mark as discontinued in medication list',
          icon: 'MinusCircle',
          variant: 'danger',
          isRecommended: true,
          payload: { name: e.medication, status: 'discontinued' }
        },
        {
          id: `alt-${intent.id}-keep`,
          label: 'Keep Active',
          description: 'No change to medication',
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'RECONCILE_MEDICATION':
      return [
        {
          id: `alt-${intent.id}-update`,
          label: `Update ${e.medication ?? 'Medication'}`,
          description: e.dosage ? `New dosage: ${e.dosage}` : 'Reconcile medication change',
          icon: 'RefreshCw',
          variant: 'primary',
          isRecommended: true,
          payload: { name: e.medication, dosage: e.dosage }
        },
        {
          id: `alt-${intent.id}-keep`,
          label: 'Keep Current Record',
          description: 'No medication changes needed',
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'UPDATE_PROBLEM_LIST':
      return [
        {
          id: `alt-${intent.id}-add`,
          label: `Add: ${e.condition ?? 'Condition'}`,
          description: 'Add to active problem list',
          icon: 'ClipboardList',
          variant: 'primary',
          isRecommended: true,
          payload: {
            condition: e.condition ?? 'Unknown',
            status: 'active',
            onsetDate: new Date().toISOString().split('T')[0]
          }
        },
        {
          id: `alt-${intent.id}-skip`,
          label: 'Already Documented',
          description: 'Condition already in problem list',
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'SCHEDULE_PROCEDURE':
      return [
        {
          id: `alt-${intent.id}-schedule`,
          label: `Schedule ${e.procedure ?? 'Procedure'}`,
          description: e.timeframe ? `Timeframe: ${e.timeframe}` : 'Submit scheduling request',
          icon: 'Calendar',
          variant: 'primary',
          isRecommended: true,
          payload: {
            name: e.procedure ?? 'Procedure',
            type: 'procedure',
            status: 'SIGNED',
            details: e.timeframe
          }
        },
        {
          id: `alt-${intent.id}-cancel`,
          label: 'Cancel',
          description: 'Do not schedule',
          icon: 'XCircle',
          variant: 'danger',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'RENEW_PRESCRIPTION':
      return [
        {
          id: `alt-${intent.id}-renew`,
          label: `Renew ${e.medication ?? 'Prescription'}`,
          description: e.quantity ? `Supply: ${e.quantity}` : 'Authorize refill',
          icon: 'RefreshCw',
          variant: 'primary',
          isRecommended: true,
          payload: { name: e.medication, quantity: e.quantity }
        },
        {
          id: `alt-${intent.id}-deny`,
          label: 'Deny Renewal',
          description: 'Requires office visit or review',
          icon: 'XCircle',
          variant: 'danger',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'UPDATE_PHONE':
      return [
        {
          id: `alt-${intent.id}-update`,
          label: `Update to ${e.phone ?? 'New Number'}`,
          description: 'Accept spoken phone number',
          icon: 'Phone',
          variant: 'primary',
          isRecommended: true,
          payload: { phone: e.phone }
        },
        {
          id: `alt-${intent.id}-keep`,
          label: `Keep ${patient.phone ?? 'Current Number'}`,
          description: 'Retain existing phone on file',
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        }
      ];

    case 'UPDATE_INSURANCE':
      return [
        {
          id: `alt-${intent.id}-update`,
          label: `Switch to ${e.carrier ?? 'New Carrier'}`,
          description: e.policyId ? `Policy: ${e.policyId}` : 'Update insurance carrier',
          icon: 'CreditCard',
          variant: 'primary',
          isRecommended: true,
          payload: { carrier: e.carrier, policyId: e.policyId }
        },
        {
          id: `alt-${intent.id}-keep`,
          label: 'Keep Current Insurance',
          description: `Retain: ${patient.insurance?.carrier ?? 'on file'}`,
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: false,
          payload: {}
        },
        {
          id: `alt-${intent.id}-flag`,
          label: 'Flag for Registration Desk',
          description: 'Route insurance update to front desk',
          icon: 'Flag',
          variant: 'warning',
          isRecommended: false,
          payload: { insurance: { carrier: e.carrier, status: 'pending_verification' } }
        }
      ];

    default:
      return [
        {
          id: `alt-${intent.id}-confirm`,
          label: 'Confirm Action',
          description: 'Accept detected clinical action',
          icon: 'CheckCircle',
          variant: 'primary',
          isRecommended: true,
          payload: intent.extractedEntities
        },
        {
          id: `alt-${intent.id}-dismiss`,
          label: 'Dismiss',
          description: 'Ignore this suggestion',
          icon: 'XCircle',
          variant: 'danger',
          isRecommended: false,
          payload: {}
        }
      ];
  }
}

function formatIntentType(type: ClinicalIntentType): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
