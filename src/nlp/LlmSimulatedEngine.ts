// ============================================================
// LLM Simulated Engine — Ambient Clinical NLP Extractor
// ============================================================
// Live Mode:  uses the KeywordTriggerMap exclusively.
//             One keyword heard → one specific pillbox appears.
//             No false positives from broad pattern matching.
//
// Demo Mode:  uses the storyboard-scripted intent sequence
//             tied to the 5-stage dialogue timeline.
// ============================================================

import type { IntentExtractor } from './IntentExtractor';
import type { ClinicalIntent, PatientRecord } from '../types';
import { findAllTriggers } from './keywordTriggerMap';

const BACKEND_NLP_URL = 'http://localhost:3001/api/nlp/analyze';

/** Dedup window — once an intent type fires, block repeats for this duration */
const DEDUP_WINDOW_MS = 15_000;

interface EmittedRecord {
  type: string;
  timestamp: number;
}

export class LlmSimulatedEngine implements IntentExtractor {
  private recentlyEmitted: EmittedRecord[] = [];

  reset(): void {
    this.recentlyEmitted = [];
  }

  /** Check if an intent type was recently emitted (dedup) */
  private isDuplicate(type: string): boolean {
    const now = Date.now();
    this.recentlyEmitted = this.recentlyEmitted.filter(
      r => now - r.timestamp < DEDUP_WINDOW_MS
    );
    return this.recentlyEmitted.some(r => r.type === type);
  }

  /** Record that one or more intent types were emitted */
  private recordEmitted(types: string[]): void {
    const now = Date.now();
    for (const type of types) {
      if (!this.recentlyEmitted.some(r => r.type === type)) {
        this.recentlyEmitted.push({ type, timestamp: now });
      }
    }
  }

  // ============================================================
  // LIVE MODE — Keyword-map-only extraction
  // ============================================================
  // Scans transcript against the KeywordTriggerMap.
  // Returns one ClinicalIntent per matched trigger.
  // No broad-pattern fallback — silence is better than noise.
  // ============================================================
  extract(text: string, _context: PatientRecord): ClinicalIntent[] {
    const triggers = findAllTriggers(text);
    if (triggers.length === 0) return [];

    const now = Date.now();
    const novelTriggers = triggers.filter(t => !this.isDuplicate(t.intentType));
    if (novelTriggers.length === 0) {
      console.log('[HoverHealth NLP] All matched keywords were recently deduped.');
      return [];
    }

    this.recordEmitted(novelTriggers.map(t => t.intentType));

    console.log(
      '[HoverHealth NLP] Keyword match →',
      novelTriggers.map(t => `"${t.pillboxCategory}" (${t.intentType})`).join(', ')
    );

    return novelTriggers.map((trigger, idx) => ({
      id: `kw-intent-${now}-${idx}`,
      type: trigger.intentType,
      confidence: trigger.confidence,
      sourceText: text,
      extractedEntities: trigger.entities,
      timestamp: new Date().toISOString()
    }));
  }

  // ============================================================
  // ASYNC EXTRACTION — tries backend first, falls back to extract()
  // ============================================================
  async extractAsync(text: string, context: PatientRecord): Promise<ClinicalIntent[]> {
    console.log('[HoverHealth Voice] FINAL :', text);
    console.log('[HoverHealth NLP] Scanning keywords against:', text.substring(0, 80));

    // 1. Try the express backend (for demo mode server-side NLP)
    try {
      const response = await fetch(BACKEND_NLP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          patientId: context.id,
          patientName: context.name
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data?.intents && Array.isArray(data.intents) && data.intents.length > 0) {
          const novelIntents = data.intents.filter((i: any) => !this.isDuplicate(i.type));

          if (novelIntents.length > 0) {
            this.recordEmitted(novelIntents.map((i: any) => i.type));
            console.log(
              '[HoverHealth NLP] Backend returned',
              novelIntents.length,
              'novel intents:',
              novelIntents.map((i: any) => i.type).join(', ')
            );

            return novelIntents.map((i: any, idx: number) => ({
              id: `backend-intent-${Date.now()}-${idx}`,
              type: i.type,
              confidence: i.confidence ?? 0.95,
              sourceText: text,
              extractedEntities: i.extractedEntities ?? {},
              timestamp: new Date().toISOString()
            }));
          } else {
            console.log('[HoverHealth NLP] Backend matched but all intent types were deduped.');
            return [];
          }
        }
        // Backend returned no intents — fall through to keyword map
        console.log('[HoverHealth NLP] Backend returned no intents. Checking keyword map...');
      }
    } catch {
      console.warn('[HoverHealth NLP] Backend offline. Using keyword map only.');
    }

    // 2. Client-side keyword map — the primary Live mode engine
    const result = this.extract(text, context);
    if (result.length > 0) {
      console.log(
        '[HoverHealth NLP] Keyword map fired',
        result.length,
        'intent(s):',
        result.map(r => r.type).join(', ')
      );
    } else {
      console.log('[HoverHealth NLP] No keyword match found — no pillbox triggered.');
    }
    return result;
  }
}
