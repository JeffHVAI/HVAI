// ============================================================
// Action Queue Store — Pillbox Action State Management
// ============================================================
// React-compatible store using a publish-subscribe pattern.
// Components call useActionQueue() hook to subscribe.

import { useState, useCallback, useRef } from 'react';
import type { PillboxAction, PillboxActionStatus } from '../types';

/**
 * Custom hook for managing the pillbox action queue.
 * Returns the queue state and mutation methods.
 */
export function useActionQueue() {
  const [actions, setActions] = useState<PillboxAction[]>([]);
  const actionIdCounter = useRef(0);

  /** Enqueue one or more new actions at the top of the pending list. */
  const enqueue = useCallback((newActions: PillboxAction[]) => {
    setActions(prev => [...newActions, ...prev]);
  }, []);

  /** Mark an action as confirmed with the selected alternative. */
  const confirmAction = useCallback((actionId: string, alternativeId: string) => {
    setActions(prev =>
      prev.map(a =>
        a.id === actionId
          ? {
              ...a,
              status: 'CONFIRMED' as PillboxActionStatus,
              selectedAlternativeId: alternativeId,
              resolvedAt: new Date().toISOString()
            }
          : a
      )
    );
  }, []);

  /** Dismiss an action (clinician chose to ignore it). */
  const dismissAction = useCallback((actionId: string) => {
    setActions(prev =>
      prev.map(a =>
        a.id === actionId
          ? {
              ...a,
              status: 'DISMISSED' as PillboxActionStatus,
              resolvedAt: new Date().toISOString()
            }
          : a
      )
    );
  }, []);

  /** Clear all resolved actions from the feed. */
  const clearResolved = useCallback(() => {
    setActions(prev => prev.filter(a => a.status === 'PENDING'));
  }, []);

  /** Reset the entire queue (e.g., on patient change or session reset). */
  const resetQueue = useCallback(() => {
    setActions([]);
    actionIdCounter.current = 0;
  }, []);

  /** Get only pending actions. */
  const pendingActions = actions.filter(a => a.status === 'PENDING');

  /** Get only resolved (confirmed + dismissed) actions. */
  const resolvedActions = actions.filter(a => a.status !== 'PENDING');

  return {
    actions,
    pendingActions,
    resolvedActions,
    enqueue,
    confirmAction,
    dismissAction,
    clearResolved,
    resetQueue
  };
}
