/**
 * ink-kanban-board — Generic type definitions
 *
 * These types define the data contract for the Kanban board.
 * They are intentionally decoupled from any specific domain —
 * consumers map their own data to these interfaces.
 */

// ── Layout tokens ──────────────────────────────────────────

/** Responsive width breakpoint for column layout direction. */
export type TerminalBreakpoint = "compact" | "medium" | "wide";

/**
 * Layout density controls how much chrome (borders, padding, detail rows) is shown.
 *
 *   spacious — large terminal (≥150×45), full decoration
 *   tiny     — everything else: minimal chrome, single-line cards, no descriptions
 */
export type LayoutDensity = "spacious" | "tiny";

// ── Color tones ────────────────────────────────────────────

/** Semantic color tone used by Panel, Pill, and column headers. */
export type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

// ── Card types ─────────────────────────────────────────────

/** Describes the visual status badge shown on a card. */
export interface CardStatus {
  /** Human-readable label (e.g. "Running", "Done", "Error") */
  label: string;
  /** Ink-compatible color name (e.g. "cyan", "green", "red") */
  color: string;
  /** When true, a spinner is rendered next to the label. */
  spinning?: boolean;
}

/** A single metadata item rendered below the card title. */
export interface MetadataItem {
  /** Display text for this metadata entry. */
  label: string;
  /** Optional Ink-compatible color override. Defaults to "gray". */
  color?: string;
  /** When true, the text is rendered with dimColor. */
  dim?: boolean;
}

/**
 * A card displayed inside a Kanban column.
 *
 * This is the primary data unit. Each card represents one work item.
 */
export interface KanbanCard {
  /** Unique key for React reconciliation. */
  key: string;
  /** Short identity label shown in the card header (e.g. "TASK 01", "PR #42"). */
  title: string;
  /** Secondary text shown below the title (e.g. file path, description). */
  subtitle?: string;
  /** Status badge — controls color, label text, and optional spinner. */
  status: CardStatus;
  /** Optional progress value between 0 and 1. Renders a progress bar in spacious density. */
  progress?: number;
  /** Optional metadata items rendered as a dot-separated line. */
  metadata?: MetadataItem[];
  /** Optional context/log line at the bottom of the card. */
  contextLine?: string;
  /** When true, the context line is rendered in red (error style). */
  contextIsError?: boolean;
  /** When true, card is rendered with dimmed styling to indicate it's a placeholder. */
  isPreview?: boolean;
  /**
   * Optional array of text lines rendered in spacious (extended) mode.
   * Each entry becomes a separate row below the card header.
   * In compact (tiny) mode these lines are hidden — only `title` is shown.
   * Cards with different-length arrays will have different visual heights.
   */
  contentLines?: string[];
  /**
   * Epoch timestamp (ms) when the card was created / entered the board.
   * Shown in both compact and extended modes as the last row.
   * Format: `HH:MM→HH:MM` (compact) or `HH:MM:SS → HH:MM:SS` (extended).
   */
  startedAt?: number;
  /**
   * Epoch timestamp (ms) when the card finished.
   * While absent the elapsed side of the time line ticks every second.
   * Once set the time line freezes at `startedAt → finishedAt`.
   */
  finishedAt?: number;
}

// ── Column types ───────────────────────────────────────────

/** A column in the Kanban board. */
export interface KanbanColumn {
  /** Unique key for React reconciliation. */
  key: string;
  /** Column header title (e.g. "TODO", "DOING", "DONE"). Count is appended automatically. */
  title: string;
  /** Color tone for the column border and header. */
  tone: Tone;
  /** Cards to display in this column. */
  cards: KanbanCard[];
}

// ── Board props ────────────────────────────────────────────

/** Props for the top-level KanbanBoard component. */
export interface KanbanBoardProps {
  /** Columns to render. Typically 3 (TODO, DOING, DONE) but any number is supported. */
  columns: KanbanColumn[];
  /** Key of the currently focused card. Affects border styling and scroll-into-view. */
  focusedCardKey?: string | null;
  /** Terminal width breakpoint. Controls column direction (row vs column). Defaults to "medium". */
  breakpoint?: TerminalBreakpoint;
  /** Layout density. Controls card detail level. Defaults to "tiny". */
  density?: LayoutDensity;
  /** Maximum visible cards per column before overflow indicators appear. Defaults to 5. */
  maxItemsPerColumn?: number;
  /** When true, shows a progress summary bar above the columns. Defaults to true. */
  showProgress?: boolean;
}

// ── Viewport (from useTerminalSize hook) ───────────────────

/** Return type of the useTerminalSize() hook. */
export interface TerminalViewport {
  width: number;
  height: number;
  breakpoint: TerminalBreakpoint;
  density: LayoutDensity;
  isShort: boolean;
}

// ── Modal Section Types ────────────────────────────────────

/** A text section displaying multi-line content with optional text input. */
export interface ModalTextSection {
  type: "text";
  /** Section header label. */
  label: string;
  /** Multi-line text content to display. */
  value: string;
  /** Placeholder shown in the input field when empty. */
  placeholder?: string;
  /** Called when the user submits text via Enter. When provided, an input field is shown. */
  onSubmit?: (text: string) => void;
}

/** A single item in a checklist section. */
export interface ChecklistItem {
  /** Unique key for this item. */
  key: string;
  /** Display label. */
  label: string;
  /** Whether the item is checked. */
  checked: boolean;
}

/** A checklist section with toggleable checkbox items. */
export interface ModalChecklistSection {
  type: "checklist";
  /** Section header label. */
  label: string;
  /** Checklist items. */
  items: ChecklistItem[];
  /** Called when an item is toggled. */
  onToggle?: (key: string, checked: boolean) => void;
}

/** An option in a select section. */
export interface SelectOption {
  /** Display label. */
  label: string;
  /** Option value passed to onChange. */
  value: string;
}

/** A single-select section. */
export interface ModalSelectSection {
  type: "select";
  /** Section header label. */
  label: string;
  /** Available options. */
  options: SelectOption[];
  /** Currently selected value. */
  value?: string;
  /** Called when the user selects an option. */
  onChange?: (value: string) => void;
}

/** A step in a pipeline/progress section. */
export interface StepItem {
  /** Unique key for this step. */
  key: string;
  /** Display label. */
  label: string;
  /** Visual status of the step. */
  status: "pending" | "active" | "done" | "error";
}

/** A steps/pipeline progress section. */
export interface ModalStepsSection {
  type: "steps";
  /** Section header label. */
  label: string;
  /** Pipeline steps. */
  steps: StepItem[];
  /** Called when the user presses Enter on a step. */
  onAction?: (key: string) => void;
}

/** Union of all supported modal section types. */
export type ModalSection =
  | ModalTextSection
  | ModalChecklistSection
  | ModalSelectSection
  | ModalStepsSection;

/** Props for the CardDetailModal component. */
export interface CardDetailModalProps {
  /** The card being inspected. Used for header display. */
  card: KanbanCard;
  /** Interactive sections to render in the modal body. */
  sections: ModalSection[];
  /** Called when the modal should close (Esc key). */
  onClose: () => void;
  /** Title override. Defaults to card.title. */
  title?: string;
}
