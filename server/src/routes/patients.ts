// ============================================================
// Patient Routes — Mock FHIR Endpoints
// ============================================================

import { Router } from 'express';

interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity?: string;
  status: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string;
  frequency: string;
  status: string;
  prescriber?: string;
}

interface OrderItem {
  id: string;
  name: string;
  type: string;
  status: string;
  urgency?: string;
  details?: string;
}

interface VitalSign {
  id: string;
  type: string;
  value: string;
  unit: string;
  recordedAt: string;
}

interface ProblemListItem {
  id: string;
  condition: string;
  icdCode?: string;
  status: string;
  onsetDate?: string;
}

interface PatientRecord {
  id: string;
  mrn: string;
  name: string;
  dob: string;
  age: number;
  gender: string;
  phone?: string;
  address: string;
  addressFlag?: string;
  insurance?: { carrier: string; policyId: string; status: string };
  allergies: Allergy[];
  medications: Medication[];
  labs: { test: string; date: string; value: string; flag?: string }[];
  imaging: { study: string; currentSlice: number; totalSlices: number };
  vitals: VitalSign[];
  problemList: ProblemListItem[];
  orders: OrderItem[];
  scenarioTag?: string;
}

// In-memory patient store (reset on server restart)
let patients: PatientRecord[] = [
  {
    id: 'pt-001',
    mrn: '49281',
    name: 'Margaret Davis',
    dob: '1952-03-14',
    age: 74,
    gender: 'Female',
    address: '742 Evergreen Terrace',
    phone: '(555) 329-8401',
    allergies: [
      { id: 'a1', substance: 'No Known Drug Allergies (NKDA)', reaction: 'None', status: 'Active' }
    ],
    medications: [
      { id: 'm0', name: 'Lisinopril', dosage: '10mg', route: 'oral', frequency: 'daily', status: 'active' }
    ],
    labs: [
      { test: 'CBC (WBC)', date: 'Today', value: '14.2 K/uL', flag: 'Elevated' },
      { test: 'CMP (Creatinine)', date: 'Today', value: '1.3 mg/dL', flag: 'Renal Caution' },
      { test: 'Lactate', date: 'Today', value: '1.4 mmol/L', flag: 'Normal' }
    ],
    imaging: { study: 'CT Abdomen/Pelvis W/ IV Contrast', currentSlice: 54, totalSlices: 110 },
    vitals: [
      { id: 'v1', type: 'BP', value: '142/88', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { id: 'v2', type: 'HR', value: '92', unit: 'bpm', recordedAt: new Date().toISOString() },
      { id: 'v3', type: 'Temp', value: '100.8', unit: '°F', recordedAt: new Date().toISOString() },
      { id: 'v4', type: 'SpO2', value: '98', unit: '%', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { id: 'p1', condition: 'Hypertension', icdCode: 'I10', status: 'chronic' }
    ],
    orders: [],
    scenarioTag: 'acute-diverticulitis'
  },
  {
    id: 'pt-002',
    mrn: '771-4820',
    name: 'Robert Chen',
    dob: '1968-03-22',
    age: 58,
    gender: 'Male',
    address: '88 Elm Ave, Unit 12',
    phone: '(555) 876-1234',
    allergies: [
      { id: 'a2', substance: 'Sulfa Drugs', reaction: 'Rash', status: 'Active' }
    ],
    medications: [
      { id: 'm1', name: 'Metformin', dosage: '1000mg', route: 'oral', frequency: 'BID', status: 'active' },
      { id: 'm2', name: 'Lisinopril', dosage: '20mg', route: 'oral', frequency: 'daily', status: 'active' },
      { id: 'm3', name: 'Atorvastatin', dosage: '40mg', route: 'oral', frequency: 'QHS', status: 'active' }
    ],
    labs: [
      { test: 'HbA1c', date: 'Jun 2025', value: '7.2%' },
      { test: 'HbA1c', date: 'Dec 2025', value: '7.8%' },
      { test: 'HbA1c', date: 'Today', value: '8.1%', flag: 'Above target (>7.0%)' }
    ],
    imaging: { study: 'None', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { id: 'v5', type: 'BP', value: '148/92', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { id: 'v6', type: 'HR', value: '76', unit: 'bpm', recordedAt: new Date().toISOString() },
      { id: 'v7', type: 'Weight', value: '210', unit: 'lbs', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { id: 'p2', condition: 'Type 2 Diabetes Mellitus', icdCode: 'E11.9', status: 'active' },
      { id: 'p3', condition: 'Essential Hypertension', icdCode: 'I10', status: 'active' },
      { id: 'p4', condition: 'Hyperlipidemia', icdCode: 'E78.5', status: 'active' }
    ],
    orders: [],
    scenarioTag: 'medication-recon'
  },
  {
    id: 'pt-003',
    mrn: '663-9001',
    name: 'Maria Santos',
    dob: '1994-07-15',
    age: 32,
    gender: 'Female',
    address: '310 Pine Dr',
    phone: '(555) 555-7890',
    allergies: [
      { id: 'a3', substance: 'No Known Drug Allergies (NKDA)', reaction: 'None', status: 'Active' }
    ],
    medications: [
      { id: 'm4', name: 'Prenatal Vitamins', dosage: '1 tab', route: 'oral', frequency: 'daily', status: 'active' }
    ],
    labs: [
      { test: 'hCG', date: 'Jul 2026', value: '45,200 mIU/mL' },
      { test: 'CBC', date: 'Today', value: 'Hgb 11.2 g/dL', flag: 'Mild anemia' }
    ],
    imaging: { study: 'OB Ultrasound', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { id: 'v8', type: 'BP', value: '118/72', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { id: 'v9', type: 'HR', value: '82', unit: 'bpm', recordedAt: new Date().toISOString() },
      { id: 'v10', type: 'Weight', value: '142', unit: 'lbs', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { id: 'p5', condition: 'Pregnancy (16 weeks)', status: 'active' }
    ],
    orders: [],
    scenarioTag: 'prenatal'
  },
  {
    id: 'pt-004',
    mrn: '552-3390',
    name: 'James Wilson',
    dob: '1959-01-08',
    age: 67,
    gender: 'Male',
    address: '7722 Cedar Lane',
    phone: '(555) 321-4567',
    allergies: [
      { id: 'a4', substance: 'Aspirin', reaction: 'GI Bleeding', status: 'Active' }
    ],
    medications: [
      { id: 'm5', name: 'Clopidogrel', dosage: '75mg', route: 'oral', frequency: 'daily', status: 'active' },
      { id: 'm6', name: 'Metoprolol', dosage: '50mg', route: 'oral', frequency: 'BID', status: 'active' },
      { id: 'm7', name: 'Rosuvastatin', dosage: '20mg', route: 'oral', frequency: 'QHS', status: 'active' }
    ],
    labs: [
      { test: 'Troponin', date: 'Admission', value: '0.82 ng/mL', flag: 'Elevated' },
      { test: 'Troponin', date: '6h post', value: '0.45 ng/mL' },
      { test: 'Troponin', date: 'Today', value: '0.08 ng/mL', flag: 'Trending down' }
    ],
    imaging: { study: 'Cardiac Cath', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { id: 'v11', type: 'BP', value: '128/78', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { id: 'v12', type: 'HR', value: '64', unit: 'bpm', recordedAt: new Date().toISOString() },
      { id: 'v13', type: 'SpO2', value: '98', unit: '%', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { id: 'p6', condition: 'CAD s/p PCI with DES (LAD)', icdCode: 'I25.10', status: 'active' },
      { id: 'p7', condition: 'NSTEMI (resolved)', status: 'resolved' }
    ],
    orders: [],
    scenarioTag: 'cardiac-followup'
  },
  {
    id: 'pt-005',
    mrn: '440-6677',
    name: 'Aisha Patel',
    dob: '1981-09-29',
    age: 45,
    gender: 'Female',
    address: '199 Birch Ct, Apt 5B',
    phone: '(555) 444-8899',
    allergies: [
      { id: 'a5', substance: 'Codeine', reaction: 'Nausea/Vomiting', status: 'Active' }
    ],
    medications: [
      { id: 'm8', name: 'Levothyroxine', dosage: '88mcg', route: 'oral', frequency: 'daily', status: 'active' },
      { id: 'm9', name: 'Escitalopram', dosage: '10mg', route: 'oral', frequency: 'daily', status: 'active' }
    ],
    labs: [
      { test: 'TSH', date: 'Mar 2026', value: '2.8 mIU/L' },
      { test: 'Lipid Panel', date: 'Today', value: 'LDL 142 mg/dL', flag: 'Borderline high' }
    ],
    imaging: { study: 'None', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { id: 'v14', type: 'BP', value: '122/74', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { id: 'v15', type: 'HR', value: '72', unit: 'bpm', recordedAt: new Date().toISOString() },
      { id: 'v16', type: 'BMI', value: '26.4', unit: 'kg/m²', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { id: 'p8', condition: 'Hypothyroidism', icdCode: 'E03.9', status: 'active' },
      { id: 'p9', condition: 'Generalized Anxiety Disorder', icdCode: 'F41.1', status: 'active' }
    ],
    orders: [],
    scenarioTag: 'annual-wellness'
  }
];

export function getPatientStore(): PatientRecord[] {
  return patients;
}

export const patientsRouter = Router();

// --- GET /api/patients ---
patientsRouter.get('/patients', (_req, res) => {
  res.json(patients);
});

// --- GET /api/patients/:id ---
patientsRouter.get('/patients/:id', (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  res.json(patient);
});

// --- PUT /api/patients/:id/demographics ---
patientsRouter.put('/patients/:id/demographics', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const body = req.body;
  if (body.address) patients[idx].address = body.address;
  if (body.phone) patients[idx].phone = body.phone;
  if (body.addressFlag !== undefined) patients[idx].addressFlag = body.addressFlag;
  if (body.insurance) patients[idx].insurance = body.insurance;
  res.json(patients[idx]);
});

// --- POST /api/patients/:id/allergies ---
patientsRouter.post('/patients/:id/allergies', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const allergy: Allergy = {
    id: `a-${Date.now()}`,
    ...req.body
  };
  // Remove NKDA if adding a real allergy
  if (!allergy.substance.includes('NKDA')) {
    patients[idx].allergies = patients[idx].allergies.filter(a => !a.substance.includes('NKDA'));
  }
  patients[idx].allergies.push(allergy);
  res.json(patients[idx]);
});

// --- PUT /api/patients/:id/allergies/:allergyId ---
patientsRouter.put('/patients/:id/allergies/:allergyId', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const aIdx = patients[idx].allergies.findIndex(a => a.id === req.params.allergyId);
  if (aIdx >= 0) {
    patients[idx].allergies[aIdx] = { ...patients[idx].allergies[aIdx], ...req.body };
  }
  res.json(patients[idx]);
});

// --- GET /api/patients/:id/medications ---
patientsRouter.get('/patients/:id/medications', (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  res.json(patient.medications);
});

// --- POST /api/patients/:id/medications ---
patientsRouter.post('/patients/:id/medications', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const med: Medication = {
    id: `m-${Date.now()}`,
    ...req.body
  };
  patients[idx].medications.push(med);
  res.json(patients[idx]);
});

// --- PUT /api/patients/:id/medications/:medId ---
patientsRouter.put('/patients/:id/medications/:medId', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const mIdx = patients[idx].medications.findIndex(m => m.id === req.params.medId);
  if (mIdx >= 0) {
    patients[idx].medications[mIdx] = { ...patients[idx].medications[mIdx], ...req.body };
  }
  res.json(patients[idx]);
});

// --- POST /api/patients/:id/orders ---
patientsRouter.post('/patients/:id/orders', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const order: OrderItem = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    ...req.body
  };
  patients[idx].orders.push(order);
  res.json(patients[idx]);
});

// --- PUT /api/patients/:id/orders/:orderId ---
patientsRouter.put('/patients/:id/orders/:orderId', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const oIdx = patients[idx].orders.findIndex(o => o.id === req.params.orderId);
  if (oIdx >= 0) {
    patients[idx].orders[oIdx] = { ...patients[idx].orders[oIdx], ...req.body };
  }
  res.json(patients[idx]);
});

// --- PUT /api/patients/:id/vitals ---
patientsRouter.put('/patients/:id/vitals', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const vital: VitalSign = {
    id: `v-${Date.now()}`,
    ...req.body
  };
  // Update existing or add new
  const vIdx = patients[idx].vitals.findIndex(v => v.type === vital.type);
  if (vIdx >= 0) {
    patients[idx].vitals[vIdx] = vital;
  } else {
    patients[idx].vitals.push(vital);
  }
  res.json(patients[idx]);
});

// --- PUT /api/patients/:id/problems ---
patientsRouter.put('/patients/:id/problems', (req, res) => {
  const idx = patients.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  const problem: ProblemListItem = {
    id: `p-${Date.now()}`,
    ...req.body
  };
  patients[idx].problemList.push(problem);
  res.json(patients[idx]);
});
