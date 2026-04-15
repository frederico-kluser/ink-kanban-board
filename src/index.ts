// ── Components ─────────────────────────────────────────────
export { KanbanBoard } from "./kanban-board.js";
export { KanbanCard } from "./kanban-card.js";
export { CardDetailModal } from "./card-detail-modal.js";
export { Panel, StatCard, Pill } from "./ui/panel.js";

// ── Hooks ──────────────────────────────────────────────────
export { useTerminalSize } from "./hooks/use-terminal-size.js";
export { useCardModal } from "./hooks/use-card-modal.js";

// ── Types ──────────────────────────────────────────────────
export type {
  // Card types
  KanbanCard as KanbanCardData,
  CardStatus,
  MetadataItem,
  // Column & board
  KanbanColumn,
  KanbanBoardProps,
  // UI primitives
  Tone,
  // Layout
  TerminalBreakpoint,
  LayoutDensity,
  TerminalViewport,
  // Modal types
  ModalSection,
  ModalTextSection,
  ModalChecklistSection,
  ModalSelectSection,
  ModalStepsSection,
  ChecklistItem,
  SelectOption,
  StepItem,
  CardDetailModalProps,
} from "./types.js";

// Re-export card props for advanced usage
export type { KanbanCardProps } from "./kanban-card.js";
export type { CardModalState } from "./hooks/use-card-modal.js";
