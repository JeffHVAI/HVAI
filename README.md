# HVAI — Hover Health Ambient Clinical Simulator

> An ambient, voice-driven EHR interface designed for gesture-based projected displays in clinical environments.

## Quick Start

> **Requires Node.js 18+ and Chrome or Edge** (for microphone/speech support)

### 1. Clone
```bash
git clone https://github.com/JeffHVAI/HVAI.git
cd HVAI
```

### 2. Start the backend — NLP + Mock FHIR server
```bash
cd server
npm install
npm start
```
✅ Prints: `🏥 Hover Health Mock FHIR Server · http://localhost:3001/api`

### 3. Start the frontend — open a second terminal in the `HVAI` folder
```bash
npm install
npm run dev
```
✅ Prints: `➜ Local: http://localhost:5173/`

### 4. Open in browser
Navigate to **http://localhost:5173/** in Chrome or Edge.

> Both terminals must stay open while using the app.

---

## Using the App

### Demo Mode
1. Click **DEMO** in the top navigation bar
2. Click any patient card (e.g. *Margaret Davis*)
3. Press the **▶ Play** button in the footer
4. The 75-second scripted encounter plays automatically — voices narrate the clinical dialogue and pillbox actions appear in sequence

### Live Mode (Voice-Triggered)
1. Click **LIVE** in the top navigation bar
2. Click any patient card to start an encounter
3. Click the **🎤 microphone button** in the footer to begin listening
4. Speak a keyword naturally — the matching clinical action pillbox appears instantly

**Example keywords to try:**

| Say | Pillbox that appears |
|---|---|
| `"good morning Mrs. Davis"` | Patient Profile |
| `"order a CBC"` | [LAB] CBC — Complete Blood Count |
| `"CT abdomen"` | [RAD] CT Abdomen/Pelvis W/ IV Contrast |
| `"morphine"` | [MED] Morphine 4 mg IV STAT |
| `"diverticulitis"` | [DX] Diverticulitis of Sigmoid Colon (K57.32) |
| `"attest note"` | [NOTE] ED Attestation & Provider Sign-Off |
| `"discharge home"` | [DISP] Finalize Discharge — Home (Routine) |

> **Silence is correct** — the listener only responds to clinical keywords. Casual speech produces no pillboxes.

---

## Overview

The Hover Health Simulator demonstrates a next-generation ambient clinical workspace where:

- **Voice NLP** listens for specific clinical keywords and surfaces the right EHR action — no keyboard, no touch required
- **Gesture Pillboxes** present actionable confirmations (medication orders, lab panels, diagnoses) that clinicians confirm with a gesture
- **FHIR R4** payloads are generated in real-time for labs, imaging, and medications
- **DAX Copilot** status appears as a silent speech balloon — no audio interruption to patient conversation
- **Ambient UI** is designed for projection onto standard hospital walls (warm greige palette)

---

## Architecture

```
Voice Input (Browser Mic / Demo Playback)
    ↓
BrowserSpeechAdapter / DemoPlaybackAdapter
    ↓
LlmSimulatedEngine → Keyword Trigger Map (35+ intents)
    ↓
ActionResolver → PillboxAction (FHIR R4 payload)
    ↓
PillboxFeed (single-focus, pop-in animation, auto-history)
    ↓
Mock FHIR Server (port 3001) ← EHR API Client
```

---

## Clinical Scenarios

Three pre-built patient scenarios available at the patient selection screen:

| Patient | Scenario | Key Demo Stages |
|---|---|---|
| **Margaret Davis**, 74F | Acute Diverticulitis | H&P → CPOE → CDS Override → Note Attestation → Discharge |
| **Robert Chen**, 58M | Medication Reconciliation | Med review, allergy check, refill |
| **Maria Santos**, 32F | Prenatal Visit | Labs, vitals, referral |

---

## Keyword Trigger Map

The Live mode uses a precise keyword lookup table — one keyword maps to exactly one pillbox. No false positives.

Full table: [`src/nlp/keywordTriggerMap.ts`](src/nlp/keywordTriggerMap.ts)

**Categories covered:**
- Patient Demographics (name, address, phone, insurance)
- Lab Orders (CBC, CMP, HbA1c, lipid panel, troponin, TSH, urinalysis, INR)
- Imaging Orders (CT, MRI, ultrasound, X-ray, echocardiogram)
- Medications (morphine, saline bolus, Augmentin, metoprolol, lisinopril, refills)
- Allergies (add / resolve)
- Vital Signs (BP, HR, temperature, SpO₂)
- Diagnosis / Problem List (diverticulitis, HTN, DM2)
- CDS Alert Override
- Note Attestation
- Referrals (surgery, GI, cardiology, PCP)
- Procedures (colonoscopy, IV access)
- Discharge Disposition

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Express, tsx, TypeScript |
| NLP | Client-side keyword map + optional LLM backend |
| EHR | Mock FHIR R4 server with 5 patient records |
| TTS | Web Speech API (natural voices) |
| Voice | Web Speech Recognition API (Chrome/Edge) |
| Icons | Lucide React |

---

## Design System

Calibrated for projection onto hospital walls:

| Token | Value | Notes |
|---|---|---|
| Background | `#C2B8A8` | Sherwin-Williams Accessible Beige SW 7036 |
| Panels | `rgba(26, 22, 18, 0.82)` | Warm glassmorphism |
| Interactive | `#3EC9C0` | Clinical teal |
| DAX Balloon | `#F0C96A` | Warm amber |
| Emergency | `#FF5B5B` | Safety-critical red |
| Success | `#4CD9A0` | Confirmed action green |

---

## License

MIT — Hoververse, Inc.
