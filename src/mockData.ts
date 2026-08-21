import type { PatientRecord, TimelineEvent, DialogueLine } from './types';

export const initialPatientRecord: PatientRecord = {
  id: 'pt-001',
  mrn: "49281",
  name: "Margaret Davis",
  dob: "1952-03-14",
  age: 74,
  gender: "Female",
  address: "742 Evergreen Terrace",
  phone: "(555) 329-8401",
  allergies: [
    { substance: "No Known Drug Allergies (NKDA)", reaction: "None", status: "Active" }
  ],
  medications: [
    { name: "Lisinopril", dosage: "10mg", route: "oral", frequency: "daily", status: "active" }
  ],
  labs: [
    { test: "CBC (WBC)", date: "Today", value: "14.2 K/uL", flag: "Elevated" },
    { test: "CMP (Creatinine)", date: "Today", value: "1.3 mg/dL", flag: "Renal Caution" },
    { test: "Lactate", date: "Today", value: "1.4 mmol/L", flag: "Normal" }
  ],
  imaging: {
    study: "CT Abdomen/Pelvis W/ IV Contrast",
    currentSlice: 54,
    totalSlices: 110
  },
  vitals: [
    { type: "BP", value: "142/88", unit: "mmHg", recordedAt: new Date().toISOString() },
    { type: "HR", value: "92", unit: "bpm", recordedAt: new Date().toISOString() },
    { type: "Temp", value: "100.8", unit: "°F", recordedAt: new Date().toISOString() },
    { type: "SpO2", value: "98", unit: "%", recordedAt: new Date().toISOString() }
  ],
  problemList: [
    { condition: "Hypertension", status: "chronic", icdCode: "I10" }
  ],
  orders: []
};

export const timelineEvents: TimelineEvent[] = [
  {
    timestamp: 0,
    timestampString: "00:00.00",
    eventId: "STAGE_1_ENTRY",
    title: "Stage 1: Ambient H&P Exam",
    description: "Clinician enters room. Patient presents with acute left lower quadrant abdominal pain."
  },
  {
    timestamp: 22.0,
    timestampString: "00:22.00",
    eventId: "STAGE_2_CPOE",
    title: "Stage 2: Deictic CPOE Orders",
    description: "Multimodal command: Stage acute lab panel, 1L NS bolus, 4mg Morphine STAT, CT Abdomen/Pelvis."
  },
  {
    timestamp: 42.0,
    timestampString: "00:42.00",
    eventId: "STAGE_3_CDS",
    title: "Stage 3: CDS Contrast Warning",
    description: "Serum Creatinine 1.3 mg/dL triggers amber renal warning. Clinician speaks override rationale."
  },
  {
    timestamp: 58.0,
    timestampString: "00:58.00",
    eventId: "STAGE_4_ATTEST",
    title: "Stage 4: Reassessment & Attestation",
    description: "Pain controlled at 2/10. Clinician attests ED note and adds Sigmoid Diverticulitis (K57.32)."
  },
  {
    timestamp: 75.0,
    timestampString: "01:15.00",
    eventId: "STAGE_5_DISCHARGE",
    title: "Stage 5: Discharge & E-Prescribing",
    description: "Stage Augmentin 875/125mg PO BID x7d prescription and finalize discharge to home."
  }
];

export const dialogueLines: DialogueLine[] = [
  {
    start: 0.0,
    end: 4.5,
    speaker: "Dr. Patel",
    text: "Good morning, Mrs. Davis. I see you're dealing with severe abdominal pain. When did this begin?"
  },
  {
    start: 4.6,
    end: 11.5,
    speaker: "Margaret Davis",
    text: "It started yesterday afternoon around 4 PM. It's a constant, cramping ache down on my lower left side. I've felt nauseous and hot, but I haven't thrown up."
  },
  {
    start: 11.6,
    end: 15.0,
    speaker: "Dr. Patel",
    text: "Any blood in your stool, dark stools, or burning when you urinate?"
  },
  {
    start: 15.1,
    end: 18.5,
    speaker: "Margaret Davis",
    text: "No, none of that. Just this sharp cramping."
  },
  {
    start: 18.6,
    end: 21.9,
    speaker: "Dr. Patel",
    text: "Abdomen is soft, non-distended. Significant focal tenderness to palpation in the left lower quadrant with involuntary guarding."
  },
  {
    start: 22.0,
    end: 32.0,
    speaker: "Dr. Patel",
    text: "Stage acute abdominal lab panel, one liter normal saline bolus, four milligrams IV morphine, and queue a CT abdomen and pelvis with IV contrast for acute diverticulitis."
  },
  {
    start: 32.1,
    end: 41.9,
    speaker: "DAX Copilot",
    text: "Four CPOE Order Pillboxes staged in Zone D. Execute orders upon clinician confirmation."
  },
  {
    start: 42.0,
    end: 51.5,
    speaker: "Dr. Patel",
    text: "Let's look at your scan results together, Mrs. Davis. Override renal alert: 1L IV saline bolus complete, acute surgical rule-out takes precedence."
  },
  {
    start: 51.6,
    end: 57.9,
    speaker: "Dr. Patel",
    text: "Right here on image 54, you can see localized swelling in your sigmoid colon. This confirms acute uncomplicated diverticulitis."
  },
  {
    start: 58.0,
    end: 67.5,
    speaker: "Dr. Patel",
    text: "Update ED course: Reassessment at 12:45 PM. Pain controlled at 2 out of 10. Tolerated 250 mL oral fluids. Bowel sounds present, abdomen soft. Attest note."
  },
  {
    start: 67.6,
    end: 74.9,
    speaker: "DAX Copilot",
    text: "ED note attested. ICD-10-CM K57.32 added to FHIR problem list. Cryptographically signed."
  },
  {
    start: 75.0,
    end: 84.0,
    speaker: "Dr. Patel",
    text: "Stage discharge prescription: Augmentin 875 over 125 milligrams orally twice daily for 7 days to Walgreens on 4th Street. Set primary care follow-up in 48 hours and outpatient colonoscopy referral in 6 weeks. Finalize discharge."
  },
  {
    start: 84.1,
    end: 88.0,
    speaker: "System",
    text: "Discharge disposition complete. AVS printed. FHIR R4 resources committed to Epic EHR."
  }
];
