import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, Activity,
  Volume2, VolumeX, Mic, MicOff, RotateCcw
} from 'lucide-react';

// Components
import BorderDock from './components/BorderDock';
import PillboxFeed from './components/PillboxFeed';
import PatientSelector from './components/PatientSelector';
import ModeToggle from './components/ModeToggle';
import GestureReticle from './components/GestureReticle';
import CtViewer from './components/CtViewer';

// Adapters
import { BrowserSpeechAdapter } from './adapters/BrowserSpeechAdapter';
import { DemoPlaybackAdapter } from './adapters/DemoPlaybackAdapter';
import type { VoiceInputAdapter } from './adapters/VoiceInputAdapter';

// NLP & EHR
import { LlmSimulatedEngine } from './nlp/LlmSimulatedEngine';
import { resolveIntents } from './ehr/ActionResolver';
import * as EhrApi from './ehr/EhrApiClient';

// Store
import { useActionQueue } from './store/ActionQueueStore';

// Data & Types
import { dialogueLines } from './mockData';
import { generateSimulatorAudioUrl } from './audioGenerator';
import type {
  PatientRecord, AuditLogEvent, AppMode,
  VoiceAdapterStatus, TranscriptChunk, PillboxAction
} from './types';

// ============================================================
// Fallback mock patient data (used when FHIR server is offline)
// ============================================================
const FALLBACK_PATIENTS: PatientRecord[] = [
  {
    id: 'pt-001',
    mrn: '884-2910',
    name: 'Jane Doe',
    dob: '1951-11-04',
    age: 74,
    gender: 'Female',
    address: '425 Maple Rd, Apt 2',
    phone: '(555) 234-5678',
    allergies: [
      { id: 'a1', substance: 'No Known Drug Allergies (NKDA)', reaction: 'None', status: 'Active' }
    ],
    medications: [],
    labs: [
      { test: 'Creatinine', date: 'Oct 2025', value: '0.9 mg/dL' },
      { test: 'Creatinine', date: 'Jan 2026', value: '1.0 mg/dL' },
      { test: 'Creatinine', date: 'Today', value: '1.1 mg/dL', flag: 'eGFR >60 mL/min • Stable' }
    ],
    imaging: { study: 'CT Abdomen/Pelvis', currentSlice: 42, totalSlices: 110 },
    vitals: [
      { type: 'BP', value: '138/82', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { type: 'HR', value: '88', unit: 'bpm', recordedAt: new Date().toISOString() },
      { type: 'Temp', value: '100.4', unit: '°F', recordedAt: new Date().toISOString() },
      { type: 'SpO2', value: '97', unit: '%', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { condition: 'Acute Appendicitis (suspected)', status: 'active' }
    ],
    orders: [],
    scenarioTag: 'allergy-conflict'
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
      { name: 'Metformin', dosage: '1000mg', route: 'oral', frequency: 'BID', status: 'active' },
      { name: 'Lisinopril', dosage: '20mg', route: 'oral', frequency: 'daily', status: 'active' },
      { name: 'Atorvastatin', dosage: '40mg', route: 'oral', frequency: 'QHS', status: 'active' }
    ],
    labs: [
      { test: 'HbA1c', date: 'Jun 2025', value: '7.2%' },
      { test: 'HbA1c', date: 'Dec 2025', value: '7.8%' },
      { test: 'HbA1c', date: 'Today', value: '8.1%', flag: 'Above target (>7.0%)' }
    ],
    imaging: { study: 'None', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { type: 'BP', value: '148/92', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { type: 'HR', value: '76', unit: 'bpm', recordedAt: new Date().toISOString() },
      { type: 'Weight', value: '210', unit: 'lbs', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { condition: 'Type 2 Diabetes Mellitus', status: 'chronic', icdCode: 'E11.9' },
      { condition: 'Essential Hypertension', status: 'chronic', icdCode: 'I10' },
      { condition: 'Hyperlipidemia', status: 'chronic', icdCode: 'E78.5' }
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
      { name: 'Prenatal Vitamins', dosage: '1 tab', route: 'oral', frequency: 'daily', status: 'active' }
    ],
    labs: [
      { test: 'hCG', date: 'Jul 2026', value: '45,200 mIU/mL' },
      { test: 'CBC', date: 'Today', value: 'Hgb 11.2 g/dL', flag: 'Mild anemia' }
    ],
    imaging: { study: 'OB Ultrasound', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { type: 'BP', value: '118/72', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { type: 'HR', value: '82', unit: 'bpm', recordedAt: new Date().toISOString() },
      { type: 'Weight', value: '142', unit: 'lbs', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { condition: 'Pregnancy (16 weeks)', status: 'active' }
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
      { name: 'Clopidogrel', dosage: '75mg', route: 'oral', frequency: 'daily', status: 'active' },
      { name: 'Metoprolol', dosage: '50mg', route: 'oral', frequency: 'BID', status: 'active' },
      { name: 'Rosuvastatin', dosage: '20mg', route: 'oral', frequency: 'QHS', status: 'active' }
    ],
    labs: [
      { test: 'Troponin', date: 'Admission', value: '0.82 ng/mL', flag: 'Elevated' },
      { test: 'Troponin', date: '6h post', value: '0.45 ng/mL' },
      { test: 'Troponin', date: 'Today', value: '0.08 ng/mL', flag: 'Trending down' }
    ],
    imaging: { study: 'Cardiac Cath', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { type: 'BP', value: '128/78', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { type: 'HR', value: '64', unit: 'bpm', recordedAt: new Date().toISOString() },
      { type: 'SpO2', value: '98', unit: '%', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { condition: 'CAD s/p PCI with DES (LAD)', status: 'active', icdCode: 'I25.10' },
      { condition: 'NSTEMI (resolved)', status: 'resolved' }
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
      { name: 'Levothyroxine', dosage: '88mcg', route: 'oral', frequency: 'daily', status: 'active' },
      { name: 'Escitalopram', dosage: '10mg', route: 'oral', frequency: 'daily', status: 'active' }
    ],
    labs: [
      { test: 'TSH', date: 'Mar 2026', value: '2.8 mIU/L' },
      { test: 'Lipid Panel', date: 'Today', value: 'LDL 142 mg/dL', flag: 'Borderline high' }
    ],
    imaging: { study: 'None', currentSlice: 1, totalSlices: 1 },
    vitals: [
      { type: 'BP', value: '122/74', unit: 'mmHg', recordedAt: new Date().toISOString() },
      { type: 'HR', value: '72', unit: 'bpm', recordedAt: new Date().toISOString() },
      { type: 'BMI', value: '26.4', unit: 'kg/m²', recordedAt: new Date().toISOString() }
    ],
    problemList: [
      { condition: 'Hypothyroidism', status: 'chronic', icdCode: 'E03.9' },
      { condition: 'Generalized Anxiety Disorder', status: 'chronic', icdCode: 'F41.1' }
    ],
    orders: [],
    scenarioTag: 'annual-wellness'
  }
];

// ============================================================
// App Component
// ============================================================
export default function App() {
  // --- Core State ---
  const [mode, setMode] = useState<AppMode>('demo');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isEncounterActive, setIsEncounterActive] = useState(false);

  // --- Voice State ---
  const [voiceStatus, setVoiceStatus] = useState<VoiceAdapterStatus>('idle');
  const [voiceError, setVoiceError] = useState<string>('');
  const voiceAdapterRef = useRef<VoiceInputAdapter | null>(null);

  // --- NLP Engine ---
  const nlpEngineRef = useRef(new LlmSimulatedEngine());

  // --- Action Queue ---
  const {
    actions,
    pendingActions,
    enqueue,
    confirmAction,
    dismissAction,
    resetQueue
  } = useActionQueue();

  // --- Audio & Playback (Demo Mode) ---
  const [audioUrl, setAudioUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const lastSpokenLineRef = useRef(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Audit Log ---
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);

  // --- DAX Copilot Balloon (replaces spoken DAX voice) ---
  const [daxBalloon, setDaxBalloon] = useState<string | null>(null);
  const daxBalloonTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // ============================================================
  // INITIALIZATION
  // ============================================================

  // Load patient roster
  useEffect(() => {
    setIsLoadingPatients(true);

    EhrApi.getPatients()
      .then(data => {
        setPatients(data);
        setIsLoadingPatients(false);
      })
      .catch(() => {
        // FHIR server offline — use fallback data
        console.warn('FHIR server not available. Using fallback patient data.');
        setPatients(FALLBACK_PATIENTS);
        setIsLoadingPatients(false);
      });
  }, []);

  // Generate demo audio
  useEffect(() => {
    const url = generateSimulatorAudioUrl();
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, []);

  // ============================================================
  // AUDIT LOGGING
  // ============================================================

  const logEvent = useCallback((action: string, targetId: string, value: any, intentType?: string, confidence?: number) => {
    const event: AuditLogEvent = {
      timestamp: new Date().toISOString(),
      actor: 'Patel, MD (#49102)',
      action,
      targetId,
      committedValue: value,
      roundTripLatencyMs: Math.floor(Math.random() * 10) + 5,
      intentType: intentType as any,
      confidence
    };
    setAuditLogs(prev => [event, ...prev]);
  }, []);



  // ============================================================
  // VOICE INPUT PIPELINE
  // ============================================================

  const handleTranscript = useCallback(async (chunk: TranscriptChunk) => {
    if (!selectedPatient || !chunk.text.trim()) return;

    console.log('[HoverHealth Voice]', chunk.isFinal ? 'FINAL' : 'interim', ':', chunk.text.substring(0, 80));

    // Run NLP extraction (Backend service + Local LLM simulation fallback)
    const intents = await nlpEngineRef.current.extractAsync(chunk.text, selectedPatient);

    if (intents.length > 0) {
      console.log('[HoverHealth Voice] Enqueuing', intents.length, 'pillbox actions');

      // Resolve intents to pillbox actions
      const pillboxActions = resolveIntents(intents, selectedPatient);

      // Enqueue to the UI feed
      enqueue(pillboxActions);

      // Log each detected intent
      intents.forEach(intent => {
        logEvent(
          'NLP_INTENT_DETECTED',
          intent.id,
          intent.extractedEntities,
          intent.type,
          intent.confidence
        );
      });
    }
  }, [selectedPatient, enqueue, logEvent]);

  // Setup/teardown voice adapter when mode or encounter changes
  useEffect(() => {
    // Cleanup previous adapter
    if (voiceAdapterRef.current) {
      voiceAdapterRef.current.destroy();
      voiceAdapterRef.current = null;
    }

    if (!isEncounterActive) return;

    let adapter: VoiceInputAdapter;

    if (mode === 'demo') {
      adapter = new DemoPlaybackAdapter(
        dialogueLines,
        () => audioRef.current?.currentTime ?? 0
      );
    } else {
      adapter = new BrowserSpeechAdapter('en-US');
    }

    adapter.onTranscript(handleTranscript);
    adapter.onError(err => setVoiceError(err));
    adapter.onStatusChange(status => setVoiceStatus(status));

    voiceAdapterRef.current = adapter;

    // In live mode, start listening immediately
    if (mode === 'live') {
      adapter.start();
    }

    return () => {
      adapter.destroy();
    };
  }, [mode, isEncounterActive, handleTranscript]);

  // ============================================================
  // PILLBOX ACTION HANDLERS
  // ============================================================

  const handlePillboxSelect = useCallback((actionId: string, alternativeId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action) return;

    const alt = action.alternatives.find(a => a.id === alternativeId);
    if (!alt) return;

    // If payload is empty, it's a "keep current" / no-op selection
    const hasPayload = Object.keys(alt.payload).length > 0;

    if (hasPayload && selectedPatient) {
      // Apply the change locally to the patient record
      applyPayloadToPatient(action, alt.payload);

      // Attempt FHIR API commit (fire-and-forget for now)
      const endpoint = action.ehrEndpoint.replace(':id', selectedPatient.id);
      fetch(`http://localhost:3001${endpoint}`, {
        method: action.ehrMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alt.payload)
      }).catch(() => {
        // FHIR server offline — local state already updated
      });
    }

    // Mark as confirmed in the queue
    confirmAction(actionId, alternativeId);

    // Audit log
    logEvent(
      'PILLBOX_CONFIRMED',
      alternativeId,
      alt.payload,
      action.intentType,
      action.confidence
    );
  }, [actions, selectedPatient, confirmAction, logEvent]);

  const handlePillboxDismiss = useCallback((actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    dismissAction(actionId);

    logEvent(
      'PILLBOX_DISMISSED',
      actionId,
      null,
      action?.intentType,
      action?.confidence
    );
  }, [actions, dismissAction, logEvent]);

  /**
   * Apply a pillbox payload to the local patient record state.
   */
  const applyPayloadToPatient = useCallback((action: PillboxAction, payload: Record<string, any>) => {
    setSelectedPatient(prev => {
      if (!prev) return prev;
      const updated = { ...prev };

      switch (action.intentType) {
        case 'UPDATE_ADDRESS':
          if (payload.address) updated.address = payload.address;
          updated.addressFlag = payload.addressFlag;
          break;

        case 'UPDATE_PHONE':
          if (payload.phone) updated.phone = payload.phone;
          break;

        case 'ADD_ALLERGY':
          if (payload.substance) {
            // Replace NKDA if present
            updated.allergies = updated.allergies.filter(a => !a.substance.includes('NKDA'));
            updated.allergies.push({
              id: `allergy-${Date.now()}`,
              substance: payload.substance,
              reaction: payload.reaction || 'Unknown',
              severity: payload.severity,
              status: payload.status || 'Active'
            });
          }
          break;

        case 'REMOVE_ALLERGY':
          if (payload.substance) {
            updated.allergies = updated.allergies.map(a =>
              a.substance.toLowerCase().includes(payload.substance.toLowerCase())
                ? { ...a, status: 'resolved' }
                : a
            );
          }
          break;

        case 'ADD_MEDICATION':
          if (payload.name) {
            updated.medications = [...(updated.medications || []), {
              id: `med-${Date.now()}`,
              name: payload.name,
              dosage: payload.dosage || '',
              route: payload.route || 'oral',
              frequency: payload.frequency || '',
              status: payload.status || 'active'
            }];
          }
          break;

        case 'DISCONTINUE_MEDICATION':
          if (payload.name) {
            updated.medications = (updated.medications || []).map(m =>
              m.name.toLowerCase().includes(payload.name.toLowerCase())
                ? { ...m, status: 'discontinued' as const }
                : m
            );
          }
          break;

        case 'RECONCILE_MEDICATION':
          if (payload.name) {
            updated.medications = (updated.medications || []).map(m =>
              m.name.toLowerCase().includes(payload.name.toLowerCase())
                ? { ...m, dosage: payload.dosage || m.dosage }
                : m
            );
          }
          break;

        case 'ORDER_LAB':
        case 'ORDER_IMAGING':
        case 'ORDER_REFERRAL':
        case 'SCHEDULE_PROCEDURE':
          if (payload.name) {
            updated.orders = [...updated.orders, {
              id: `ORD-${Date.now().toString().slice(-4)}`,
              name: payload.name,
              type: payload.type || 'other',
              status: payload.status || 'SIGNED',
              urgency: payload.urgency,
              details: payload.details
            }];
          }
          break;

        case 'RECORD_VITALS':
          if (payload.type && payload.value) {
            const existing = (updated.vitals || []).findIndex(
              v => v.type.toLowerCase() === payload.type.toLowerCase()
            );
            const newVital = {
              id: `vital-${Date.now()}`,
              type: payload.type,
              value: payload.value,
              unit: payload.unit || '',
              recordedAt: payload.recordedAt || new Date().toISOString()
            };
            if (existing >= 0) {
              updated.vitals = [...updated.vitals];
              updated.vitals[existing] = newVital;
            } else {
              updated.vitals = [...(updated.vitals || []), newVital];
            }
          }
          break;

        case 'UPDATE_PROBLEM_LIST':
          if (payload.condition) {
            updated.problemList = [...(updated.problemList || []), {
              id: `prob-${Date.now()}`,
              condition: payload.condition,
              status: payload.status || 'active',
              onsetDate: payload.onsetDate
            }];
          }
          break;

        case 'RENEW_PRESCRIPTION':
          // Mark as renewed — in practice this would create a new Rx order
          if (payload.name) {
            updated.orders = [...updated.orders, {
              id: `RX-${Date.now().toString().slice(-4)}`,
              name: `Rx Renewal: ${payload.name}`,
              type: 'medication' as const,
              status: 'SIGNED' as const
            }];
          }
          break;
      }

      return updated;
    });
  }, []);

  // ============================================================
  // DEMO MODE: Audio & Playback
  // ============================================================

  const setupWebAudio = () => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.warn('Failed to initialize Web Audio Analyser:', e);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      voiceAdapterRef.current?.stop();
      window.speechSynthesis.cancel();
      lastSpokenLineRef.current = -1;
    } else {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      } else {
        setupWebAudio();
      }
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          voiceAdapterRef.current?.start();
        })
        .catch(err => console.error('Playback failed:', err));
    }
  };

  // Audio element listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 75);
    const onEnded = () => {
      setIsPlaying(false);
      voiceAdapterRef.current?.stop();
      window.speechSynthesis.cancel();
      lastSpokenLineRef.current = -1;
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  // Waveform canvas animation
  useEffect(() => {
    let animationId: number;
    const render = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setCurrentTime(audioRef.current.currentTime);
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          ctx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
          ctx.lineWidth = 1;
          for (let x = 0; x < width; x += 25) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }

          if (analyserRef.current && isPlaying) {
            const analyser = analyserRef.current;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);
            ctx.lineWidth = 2.5;
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#00f2fe');
            gradient.addColorStop(0.5, '#00e676');
            gradient.addColorStop(1, '#ffd600');
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            const sliceWidth = width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0;
              const y = (v * height) / 2;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
              x += sliceWidth;
            }
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.strokeStyle = isPlaying ? '#00f2fe' : 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1.5;
            ctx.moveTo(0, height / 2);
            for (let x = 0; x < width; x += 5) {
              const noise = isPlaying ? (Math.random() - 0.5) * 4 : 0;
              ctx.lineTo(x, height / 2 + noise);
            }
            ctx.stroke();
          }
        }
      }
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  // Demo TTS
  const activeDialogueLineIndex = dialogueLines.findIndex(
    line => currentTime >= line.start && currentTime <= line.end
  );

  useEffect(() => {
    if (mode !== 'demo' || !isTtsEnabled || activeDialogueLineIndex === -1) {
      if (activeDialogueLineIndex === -1) {
        window.speechSynthesis.cancel();
        lastSpokenLineRef.current = -1;
      }
      return;
    }
    if (activeDialogueLineIndex !== lastSpokenLineRef.current) {
      window.speechSynthesis.cancel();
      const dialogue = dialogueLines[activeDialogueLineIndex];
      lastSpokenLineRef.current = activeDialogueLineIndex;

      // DAX Copilot & System lines: show balloon, do NOT speak (avoids interrupting patient)
      if (dialogue.speaker === 'DAX Copilot' || dialogue.speaker === 'System') {
        if (daxBalloonTimerRef.current) clearTimeout(daxBalloonTimerRef.current);
        setDaxBalloon(dialogue.text);
        // Auto-hide after the line's display window ends
        const lineDuration = (dialogue.end - dialogue.start) * 1000 + 2000;
        daxBalloonTimerRef.current = setTimeout(() => setDaxBalloon(null), lineDuration);
        return;
      }

      // Clinician and patient lines — speak naturally
      const utterance = new SpeechSynthesisUtterance(dialogue.text);
      const voices = window.speechSynthesis.getVoices();

      if (dialogue.speaker === 'Dr. Patel') {
        // Natural male voice — prefer Google US English Male, then Microsoft Guy/Mark/David
        const maleVoice = voices.find(v =>
          v.name.includes('Google US English Male')
        ) || voices.find(v =>
          v.name.includes('Microsoft Guy') || v.name.includes('Microsoft Mark')
        ) || voices.find(v =>
          v.name.toLowerCase().includes('male') && v.lang.startsWith('en')
        ) || voices.find(v =>
          v.name.includes('Microsoft David')
        );
        if (maleVoice) utterance.voice = maleVoice;
        utterance.pitch = 1.0;
        utterance.rate = 0.95;
      } else if (dialogue.speaker === 'Margaret Davis') {
        // Natural female voice for the patient
        const femaleVoice = voices.find(v =>
          v.name.includes('Google US English Female')
        ) || voices.find(v =>
          v.name.includes('Microsoft Zira') || v.name.includes('Microsoft Aria')
        ) || voices.find(v =>
          v.name.toLowerCase().includes('female') && v.lang.startsWith('en')
        );
        if (femaleVoice) utterance.voice = femaleVoice;
        utterance.pitch = 1.05;
        utterance.rate = 0.92;
      }

      window.speechSynthesis.speak(utterance);
    }
  }, [activeDialogueLineIndex, isTtsEnabled, mode]);

  // Timeline scrubbing
  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    window.speechSynthesis.cancel();
    lastSpokenLineRef.current = -1;

    // Reset demo adapter for scrubbing
    if (voiceAdapterRef.current instanceof DemoPlaybackAdapter) {
      voiceAdapterRef.current.resetToTime(newTime);
    }
  };

  // ============================================================
  // ENCOUNTER LIFECYCLE
  // ============================================================

  const handlePatientSelect = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setIsEncounterActive(true);
    resetQueue();
    nlpEngineRef.current.reset();
    setAuditLogs([]);
    setCurrentTime(0);
    setIsPlaying(false);
    lastSpokenLineRef.current = -1;
    setVoiceError('');

    // Simultaneous Dr. Patel RFID proximity badge authentication
    logEvent('CLINICIAN_RFID_BADGE_SCAN', 'badge-49102', { clinician: 'Patel, MD (#49102)', room: 'Room 4B', authenticated: true });
    logEvent('ENCOUNTER_STARTED', patient.id, { patient: patient.name, mrn: patient.mrn });
  };

  const handleEndEncounter = () => {
    voiceAdapterRef.current?.stop();
    setIsEncounterActive(false);
    setSelectedPatient(null);
    setIsPlaying(false);
    setCurrentTime(0);
    window.speechSynthesis.cancel();
    lastSpokenLineRef.current = -1;
  };

  const handleModeChange = (newMode: AppMode) => {
    // Stop current voice adapter and playback
    voiceAdapterRef.current?.stop();
    setIsPlaying(false);
    window.speechSynthesis.cancel();
    lastSpokenLineRef.current = -1;

    setMode(newMode);
    resetQueue();
    nlpEngineRef.current.reset();
    setVoiceError('');
  };

  // Live mode: toggle mic
  const handleToggleMic = () => {
    if (!voiceAdapterRef.current) return;
    if (voiceStatus === 'listening') {
      voiceAdapterRef.current.stop();
    } else {
      voiceAdapterRef.current.start();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="app-container">
      {/* Gesture Reticle — spatial projection cursor */}
      <GestureReticle />

      {/* Hidden audio engine (Demo Mode) */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}

      {/* 1. ZONE A — Patient Identity Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon-box">✦</div>
          <h1 className="brand-title">Hover Health</h1>
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        <div className="system-status">
          {voiceError && (
            <span className="status-badge" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
              {voiceError}
            </span>
          )}
          <span className="status-badge">
            <span className={`status-indicator ${isEncounterActive ? 'success' : 'active'}`} />
            {isEncounterActive && selectedPatient
              ? `Dr. Patel, MD • ${selectedPatient.name}`
              : 'Select a Patient'}
          </span>
          <span className="status-badge">
            <Activity className="status-indicator success" style={{ width: 14, height: 14 }} />
            Refractor SurfaceWare: Connected
          </span>
        </div>
      </header>

      {/* 2. ZONE B — Context & Vitals Rail */}
      <BorderDock
        patient={selectedPatient}
        auditLogs={auditLogs}
      />

      {/* 3. ZONE C — Dynamic Focus Canvas */}
      <main className="main-stage">
        {!isEncounterActive ? (
          /* Patient Selection Screen */
          <div className="stage-wrapper">
            <PatientSelector
              patients={patients}
              onSelect={handlePatientSelect}
              isLoading={isLoadingPatients}
            />
          </div>
        ) : (
          /* Active Encounter: Single-Focus Pillbox + History */
          <div className="stage-wrapper" style={{ position: 'relative', height: '100%' }}>
            {mode === 'demo' && currentTime >= 42 && currentTime < 68 && (
              <CtViewer currentSlice={54} totalSlices={110} studyTitle="CT Abdomen/Pelvis W/ IV Contrast" />
            )}

            {/* Active pillbox feed — shows only current pending action prominently */}
            <PillboxFeed
              actions={actions}
              voiceStatus={voiceStatus}
              onSelect={handlePillboxSelect}
              onDismiss={handlePillboxDismiss}
            />

            {/* End Encounter — only when all actions resolved */}
            {actions.length > 0 && pendingActions.length === 0 && (
              <div className="pillbox-group" style={{ maxWidth: 480 }}>
                <button className="large-pillbox" onClick={handleEndEncounter}>
                  <div className="pillbox-icon-container">
                    <RotateCcw style={{ width: 22, height: 22 }} />
                  </div>
                  <div className="pillbox-content-stack">
                    <span className="pillbox-primary-label">End Encounter / Select New Patient</span>
                    <span className="pillbox-subtext">Finalize session and return to patient roster</span>
                  </div>
                  <span className="pillbox-status-tag">End Session</span>
                </button>
              </div>
            )}

            {/* DAX Says balloon — silent ambient status */}
            {daxBalloon && (
              <div className="dax-balloon">
                <span className="dax-balloon-label">✦ DAX says</span>
                <span className="dax-balloon-text">{daxBalloon}</span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. ZONE D Footer — Audio & Voice Controls */}
      <footer className="app-footer">
        <div className="footer-top-row">
          {mode === 'demo' ? (
            /* Demo Mode Footer */
            <>
              <div className="audio-controls">
                <button
                  className="btn-play-round"
                  onClick={handlePlayPause}
                  title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
                  disabled={!isEncounterActive}
                >
                  {isPlaying
                    ? <Pause style={{ width: 20, height: 20 }} />
                    : <Play style={{ width: 20, height: 20, marginLeft: 2 }} />}
                </button>
                <button
                  className="dock-audit-btn"
                  onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  title="Toggle Speech Synthesis"
                >
                  {isTtsEnabled
                    ? <Volume2 style={{ width: 14, height: 14 }} />
                    : <VolumeX style={{ width: 14, height: 14 }} />}
                  {isTtsEnabled ? 'TTS: On' : 'TTS: Off'}
                </button>
              </div>

              {/* Subtitle */}
              <div className="subtitle-banner" style={{ flex: 1 }}>
                {activeDialogueLineIndex !== -1 && (() => {
                  const line = dialogueLines[activeDialogueLineIndex];
                  // DAX/System lines appear only in the balloon — not the subtitle bar
                  if (line.speaker === 'DAX Copilot' || line.speaker === 'System') return null;
                  const isPatient = line.speaker === 'Margaret Davis';
                  return (
                    <>
                      <span className={`speaker-pill ${isPatient ? 'patient' : ''}`}>
                        {isPatient ? 'PATIENT' : line.speaker.toUpperCase()}
                      </span>
                      <span>{line.text}</span>
                    </>
                  );
                })() || (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: 13 }}>
                    Ambient listening...
                  </span>
                )}
              </div>
            </>
          ) : (
            /* Live Mode Footer */
            <>
              <div className="audio-controls">
                <button
                  className={`btn-play-round ${voiceStatus === 'listening' ? 'listening-active' : ''}`}
                  onClick={handleToggleMic}
                  title={voiceStatus === 'listening' ? 'Stop Listening' : 'Start Listening'}
                  disabled={!isEncounterActive}
                >
                  {voiceStatus === 'listening'
                    ? <MicOff style={{ width: 20, height: 20 }} />
                    : <Mic style={{ width: 20, height: 20 }} />}
                </button>
                <span className="status-badge">
                  <span className={`status-indicator ${voiceStatus === 'listening' ? 'active' : ''}`} />
                  {voiceStatus === 'listening' ? 'Listening...' : voiceStatus === 'error' ? 'Error' : 'Mic Off'}
                </span>
              </div>

              <div className="subtitle-banner" style={{ flex: 1 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {voiceStatus === 'listening'
                    ? 'Speak naturally. Clinical intents will appear as pillbox confirmations.'
                    : isEncounterActive ? 'Tap the microphone to start listening.' : 'Select a patient to begin.'}
                </span>
              </div>
            </>
          )}

          {/* Waveform Canvas */}
          <div className="waveform-canvas-box" style={{ width: 280 }}>
            <canvas ref={canvasRef} width={280} height={48} className="waveform-canvas" />
          </div>
        </div>

        {/* Timeline (Demo Mode only) */}
        {mode === 'demo' && (
          <div className="timeline-progress-track" onClick={handleTimelineScrub}>
            <div
              className="timeline-progress-bar"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}
      </footer>
    </div>
  );
}
