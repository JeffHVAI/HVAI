// ============================================================
// Mock Epic FHIR Server — Express Entry Point
// ============================================================
// Lightweight REST API simulating Epic FHIR-like endpoints.
// Runs on localhost:3001 with CORS enabled.

import express from 'express';
import cors from 'cors';
import { patientsRouter, getPatientStore } from './routes/patients.js';
import { nlpRouter } from './routes/nlp.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api', patientsRouter);
app.use('/api/nlp', nlpRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Hover Health Mock FHIR Server',
    version: '1.0.0',
    patients: getPatientStore().length
  });
});

app.listen(PORT, () => {
  console.log(`\n  🏥 Hover Health Mock FHIR Server`);
  console.log(`  ────────────────────────────────`);
  console.log(`  API:     http://localhost:${PORT}/api`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  Patients: ${getPatientStore().length} loaded\n`);
});
