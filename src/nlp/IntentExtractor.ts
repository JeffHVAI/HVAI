// ============================================================
// Intent Extractor — Interface
// ============================================================

import type { ClinicalIntent, PatientRecord } from '../types';

export interface IntentExtractor {
  /**
   * Extract clinical intents from a transcript fragment.
   * @param text      The transcript text to analyze
   * @param context   Current patient record for context-aware extraction
   * @returns         Array of detected clinical intents
   */
  extract(text: string, context: PatientRecord): ClinicalIntent[];

  /**
   * Reset the deduplication buffer (e.g., on patient change or session reset).
   */
  reset(): void;
}
