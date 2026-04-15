import { useState, useCallback } from "react";
import type { KanbanCard } from "../types.js";

/** State returned by the useCardModal hook. */
export interface CardModalState {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** The card being inspected, or null when closed. */
  card: KanbanCard | null;
  /** Open the modal for the given card. */
  open: (card: KanbanCard) => void;
  /** Close the modal. */
  close: () => void;
}

/**
 * Hook that manages the open/close state of a card detail modal.
 *
 * Use `isOpen` to conditionally render the `CardDetailModal` component
 * and to disable board navigation while the modal is open:
 *
 * @example
 * ```tsx
 * const { isOpen, card, open, close } = useCardModal();
 *
 * useInput((input, key) => {
 *   if (key.return && focusedKey) {
 *     const c = findCard(focusedKey);
 *     if (c) open(c);
 *   }
 * }, { isActive: !isOpen });
 * ```
 */
export function useCardModal(): CardModalState {
  const [card, setCard] = useState<KanbanCard | null>(null);

  const open = useCallback((c: KanbanCard) => setCard(c), []);
  const close = useCallback(() => setCard(null), []);

  return {
    isOpen: card !== null,
    card,
    open,
    close,
  };
}
