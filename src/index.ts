// ── Components ─────────────────────────────────────────────
export { KanbanBoard } from "./kanban-board.js";
export { KanbanCard } from "./kanban-card.js";
export { Panel, StatCard, Pill } from "./ui/panel.js";

// ── Hooks ──────────────────────────────────────────────────
export { useTerminalSize } from "./hooks/use-terminal-size.js";

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
} from "./types.js";

// Re-export card props for advanced usage
export type { KanbanCardProps } from "./kanban-card.js";
