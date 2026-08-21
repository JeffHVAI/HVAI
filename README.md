# HVAI — Hover Health Ambient Clinical Simulator

> An ambient, voice-driven EHR interface designed for gesture-based projected displays in clinical environments.

![Hover Health Simulator](src/assets/hero.png)

## Overview

The Hover Health Simulator demonstrates a next-generation ambient clinical workspace where:

- **Voice NLP** listens for specific clinical keywords and surfaces the right EHR action — no keyboard, no touch
- **Gesture Pillboxes** present actionable confirmations (medication orders, lab panels, diagnoses) that clinicians confirm with a gesture
- **FHIR R4** payloads are generated in real-time for labs, imaging, and medications
- **DAX Copilot** status appears as a silent speech balloon — no audio interruption to patient conversation
- **Ambient UI** is designed for projection onto standard hospital walls (Sherwin-Williams Accessible Beige palette)

## Architecture

```
Voice Input (Browser Mic / Demo Playback)
    ↓
BrowserSpeechAdapter / DemoPlaybackAdapter
    ↓
LlmSimulatedEngine (Keyword Trigger Map)
    ↓
ActionResolver → PillboxAction
    ↓
PillboxFeed (Single-focus, pop-in, auto-history)
    ↓
EHR API Client → Mock FHIR Server (port 3001)
```

## Modes

| Mode | Description |
|---|---|
| **Demo** | 75-second scripted storyboard with TTS voices. Select a patient and press Play. |
| **Live** | Real microphone input. Speak a keyword and the matching pillbox appears instantly. |

## Keyword → Pillbox Trigger Map

The Live mode listener waits silently until a specific keyword is spoken. Examples:

| Say | Pillbox Appears |
|---|---|
| `"CBC"` | [LAB] CBC — Complete Blood Count |
| `"good morning Mrs. Davis"` | Patient Profile Selection |
| `"CT abdomen"` | [RAD] CT Abdomen/Pelvis W/ IV Contrast |
| `"morphine"` | [MED] Morphine 4 mg IV STAT |
| `"diverticulitis"` | [DX] Diverticulitis of Sigmoid Colon (K57.32) |
| `"attest note"` | [NOTE] ED Attestation & Provider Sign-Off |
| `"discharge home"` | [DISP] Finalize Discharge — Home (Routine) |

> See `src/nlp/keywordTriggerMap.ts` for the full 35+ entry table.

## Clinical Scenarios

Three pre-built patient scenarios:

1. **Margaret Davis** — 74F, Acute Diverticulitis (5-stage ED encounter)
2. **Robert Chen** — 58M, Medication Reconciliation
3. **Maria Santos** — 32F, Prenatal Visit

## Quick Start

### Frontend (React + Vite)
```bash
npm install
npm run dev
# → http://localhost:5173
```

### Backend (Express NLP + Mock FHIR)
```bash
cd server
npm install
npm start
# → http://localhost:3001/api
```

## Stack

- **Frontend**: React 19, TypeScript, Vite, Lucide React
- **Backend**: Express, tsx, TypeScript
- **NLP**: Client-side keyword trigger map + optional LLM backend
- **EHR**: Mock FHIR R4 server with 5 patient records
- **TTS**: Web Speech API (Google/Microsoft natural voices)
- **Voice**: Web Speech Recognition API (Chrome/Edge)

## Design Tokens

Warm ambient palette calibrated for projection onto hospital walls:
- Background: `#C2B8A8` (Sherwin-Williams Accessible Beige SW 7036)
- Panels: `rgba(26, 22, 18, 0.82)` glassmorphism
- Interactive: `#3EC9C0` clinical teal
- Accent: `#F0C96A` warm amber (DAX balloon)

## License

MIT — Hoververse, Inc.
