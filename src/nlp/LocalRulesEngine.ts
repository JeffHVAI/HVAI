// ============================================================
// Local Rules Engine — NLP Implementation
// ============================================================
// Keyword + regex-based clinical intent extraction. Runs entirely
// in the browser. Designed with a clean interface so an LLM or
// Hover OS NLP service can be swapped in.

import type { IntentExtractor } from './IntentExtractor';
import type { ClinicalIntent, ClinicalIntentType, PatientRecord } from '../types';
import { INTENT_PATTERNS } from './intentPatterns';

/** Deduplication window in milliseconds */
const DEDUP_WINDOW_MS = 8000;

/** Minimum confidence threshold to emit an intent */
const MIN_CONFIDENCE = 0.50;

interface EmittedRecord {
  type: ClinicalIntentType;
  entities: string;
  timestamp: number;
}

export class LocalRulesEngine implements IntentExtractor {
  private recentlyEmitted: EmittedRecord[] = [];

  extract(text: string, context: PatientRecord): ClinicalIntent[] {
    const normalizedText = text.toLowerCase().trim();
    if (normalizedText.length < 3) return [];

    const intents: ClinicalIntent[] = [];
    const now = Date.now();

    // Clean expired dedup entries
    this.recentlyEmitted = this.recentlyEmitted.filter(
      r => now - r.timestamp < DEDUP_WINDOW_MS
    );

    for (const pattern of INTENT_PATTERNS) {
      // Check if any trigger phrase matches
      const matchedPhrase = pattern.triggerPhrases.find(phrase =>
        normalizedText.includes(phrase)
      );

      if (!matchedPhrase) continue;

      // Extract entities
      const entities: Record<string, string> = {};
      let entityBonus = 0;

      for (const [entityName, regex] of Object.entries(pattern.entityPatterns)) {
        const match = text.match(regex);
        if (match?.[1]) {
          entities[entityName] = match[1].trim();
          entityBonus += 0.05; // Boost confidence for each extracted entity
        }
      }

      // Calculate confidence
      let confidence = pattern.baseConfidence + entityBonus;

      // Boost confidence if entities match expected clinical vocabulary
      if (entities.labTest || entities.study || entities.substance || entities.medication) {
        confidence += 0.03;
      }

      // Context-aware adjustments
      confidence = this.adjustConfidence(confidence, pattern.type, entities, context);
      confidence = Math.min(1.0, Math.max(0.0, confidence));

      if (confidence < MIN_CONFIDENCE) continue;

      // Deduplication check
      const entityFingerprint = JSON.stringify(entities);
      const isDuplicate = this.recentlyEmitted.some(
        r => r.type === pattern.type && r.entities === entityFingerprint
      );

      if (isDuplicate) continue;

      // Generate description from template
      let description = pattern.descriptionTemplate;
      for (const [key, value] of Object.entries(entities)) {
        description = description.replace(`{{${key}}}`, value);
      }
      // Remove unreplaced placeholders
      description = description.replace(/\{\{[^}]+\}\}/g, '(unspecified)');

      const intent: ClinicalIntent = {
        id: `intent-${now}-${Math.random().toString(36).slice(2, 8)}`,
        type: pattern.type,
        confidence,
        sourceText: text,
        extractedEntities: entities,
        timestamp: new Date().toISOString()
      };

      intents.push(intent);

      // Record for deduplication
      this.recentlyEmitted.push({
        type: pattern.type,
        entities: entityFingerprint,
        timestamp: now
      });
    }

    return intents;
  }

  reset(): void {
    this.recentlyEmitted = [];
  }

  /**
   * Context-aware confidence adjustments based on patient record state.
   */
  private adjustConfidence(
    base: number,
    type: ClinicalIntentType,
    entities: Record<string, string>,
    context: PatientRecord
  ): number {
    let adjusted = base;

    switch (type) {
      case 'ADD_ALLERGY':
        // Higher confidence if current profile is NKDA and substance was extracted
        if (
          context.allergies.some(a => a.substance.includes('NKDA')) &&
          entities.substance
        ) {
          adjusted += 0.08; // Conflict detected = more actionable
        }
        break;

      case 'UPDATE_ADDRESS':
        // Higher confidence if extracted address differs from current
        if (entities.address && !context.address.toLowerCase().includes(entities.address.toLowerCase().slice(0, 10))) {
          adjusted += 0.06;
        }
        break;

      case 'ORDER_LAB':
      case 'ORDER_IMAGING':
        // Boost if spoken by the doctor (in demo mode, we can't tell;
        // for production, Hover OS could tag speaker)
        adjusted += 0.02;
        break;

      case 'RECONCILE_MEDICATION':
        // Boost if the mentioned medication exists in the current list
        if (entities.medication) {
          const medName = entities.medication.toLowerCase();
          if (context.medications?.some(m => m.name.toLowerCase().includes(medName))) {
            adjusted += 0.08;
          }
        }
        break;

      default:
        break;
    }

    return adjusted;
  }
}
