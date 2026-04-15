# ink-kanban-board

A modular, responsive Kanban board component for [Ink](https://github.com/vadimdemedes/ink) terminal applications. Zero domain coupling — bring your own data model and map it to the board's generic interfaces.

## Installation

```bash
npm install ink-kanban-board
```

**Peer dependencies:** `react >= 18`, `ink >= 5`, `@inkjs/ui >= 2`

## Quick Start

```tsx
import React from "react";
import { render, Box } from "ink";
import { KanbanBoard, type KanbanColumn } from "ink-kanban-board";

const columns: KanbanColumn[] = [
  {
    key: "todo",
    title: "TODO",
    tone: "warning",
    cards: [
      { key: "t1", title: "TASK 01", status: { label: "Pending", color: "gray" } },
      { key: "t2", title: "TASK 02", status: { label: "Pending", color: "gray" } },
    ],
  },
  {
    key: "doing",
    title: "DOING",
    tone: "accent",
    cards: [
      { key: "t3", title: "TASK 03", status: { label: "Running", color: "cyan", spinning: true } },
    ],
  },
  {
    key: "done",
    title: "DONE",
    tone: "success",
    cards: [
      { key: "t4", title: "TASK 04", status: { label: "Done", color: "green" } },
    ],
  },
];

render(
  <Box padding={1}>
    <KanbanBoard columns={columns} density="tiny" />
  </Box>
);
```

The board renders immediately. Every visual aspect — columns, cards, colors, timers — is driven by the data you pass in.

---

## Core Concepts

### Data Model

The board is a pure rendering layer. It receives a `KanbanColumn[]` array and renders it. There is no internal state machine, no drag-and-drop, and no column management. You own the state; the board renders it.

```
Your domain data  →  adapter function  →  KanbanColumn[]  →  <KanbanBoard />
```

Each `KanbanColumn` contains an array of `KanbanCardData` objects. Cards carry all the information the board needs to render them — title, status badge, colors, timer timestamps, content lines, etc.

### Density & Breakpoints

The `useTerminalSize()` hook measures the terminal and returns two layout tokens:

| Token | Values | Determines |
|---|---|---|
| `breakpoint` | `"compact"` · `"medium"` · `"wide"` | Column direction (`column` vs `row`) |
| `density` | `"tiny"` · `"spacious"` | Card detail level |

**Thresholds:**

| Terminal size | Breakpoint | Density |
|---|---|---|
| < 110 cols | `compact` | `tiny` |
| 110–149 cols | `medium` | `tiny` |
| ≥ 150 cols and ≥ 45 rows | `wide` | `spacious` |

```tsx
import { useTerminalSize } from "ink-kanban-board";

function App() {
  const { breakpoint, density } = useTerminalSize();
  return <KanbanBoard columns={columns} breakpoint={breakpoint} density={density} />;
}
```

In **tiny** density, cards render as compact single-line entries (title + status + timer). In **spacious** density, cards expand to show subtitle, progress bar, metadata, content lines, and full timestamps.

You can also override these values manually: `density="spacious"` forces extended cards regardless of terminal size.

---

## Columns

### Creating Columns

A column requires four fields:

```tsx
interface KanbanColumn {
  key: string;       // unique identifier for React reconciliation
  title: string;     // header text — card count is appended automatically: "TODO (3)"
  tone: Tone;        // semantic color for the column border and header
  cards: KanbanCardData[];
}
```

The board supports **any number of columns**, not just three. Here's a 5-column CI/CD pipeline:

```tsx
const columns: KanbanColumn[] = [
  { key: "queue",  title: "QUEUE",  tone: "neutral", cards: queueCards },
  { key: "build",  title: "BUILD",  tone: "warning", cards: buildCards },
  { key: "test",   title: "TEST",   tone: "accent",  cards: testCards },
  { key: "deploy", title: "DEPLOY", tone: "danger",  cards: deployCards },
  { key: "live",   title: "LIVE",   tone: "success", cards: liveCards },
];
```

### Column Tones

The `tone` property maps to a fixed color palette used for column borders and headers:

| Tone | Color | Typical use |
|---|---|---|
| `"neutral"` | gray | Backlog, archive, inactive |
| `"accent"` | cyan | In-progress, active |
| `"success"` | green | Done, deployed, live |
| `"warning"` | yellow | Pending, queued, attention |
| `"danger"` | red | Failed, blocked, critical |

Tones affect only the column container (border + title). Individual card colors are controlled independently via `status.color`.

---

## Cards

### Required Fields

Every card must have:

```tsx
{
  key: "unique-id",
  title: "TASK 01",
  status: {
    label: "Running",     // text shown in the status badge
    color: "cyan",        // Ink-compatible color — controls card border color
    spinning: true,       // optional: renders a spinner next to the label
  },
}
```

### Card Border Color

The card's **border color is determined by `status.color`**. This is the primary mechanism for visual differentiation:

```tsx
// Normal card — cyan border
status: { label: "Running", color: "cyan" }

// Error card — red border + red context line
status: { label: "Error", color: "red" }
contextLine: "UNIQUE constraint failed: users.email"
contextIsError: true

// Success card — green border
status: { label: "Done", color: "green" }

// Warning card — yellow border
status: { label: "Queued", color: "yellow" }
```

Any [Ink-compatible color](https://github.com/vadimdemedes/ink#color) is valid: `"red"`, `"green"`, `"cyan"`, `"yellow"`, `"magenta"`, `"gray"`, `"blueBright"`, `"redBright"`, `"white"`, etc.

**Special border overrides:**
- When `focused === true` → border becomes `cyanBright` with `bold` style
- When `isPreview === true` → border becomes `gray` (dimmed placeholder)

### Error Cards

To render a card that visually communicates an error:

```tsx
{
  key: "failed-task",
  title: "SEED SCRIPT",
  status: { label: "Error", color: "red" },
  contextLine: "UNIQUE constraint failed: users.email",
  contextIsError: true,    // renders contextLine in red instead of gray
  contentLines: [
    "Inserted 1,200 rows into users",
    "FAILED at row 1,201 — duplicate key",
  ],
}
```

The combination of `color: "red"` (red border) + `contextIsError: true` (red context line) creates a clear error visual.

### Optional Fields

| Field | Type | Density | Description |
|---|---|---|---|
| `subtitle` | `string` | spacious | Secondary text below the title |
| `progress` | `number` (0–1) | spacious | Renders a progress bar: `[████····] 65%` |
| `metadata` | `MetadataItem[]` | spacious | Dot-separated line: `env: prod • region: us-east-1` |
| `contextLine` | `string` | spacious | Bottom context/log line |
| `contextIsError` | `boolean` | spacious | Renders `contextLine` in red |
| `isPreview` | `boolean` | both | Dims the card (gray border, gray title) |
| `contentLines` | `string[]` | spacious | Variable-height content rows (see below) |
| `startedAt` | `number` | both | Timer start epoch — see [Time Tracking](#time-tracking) |
| `finishedAt` | `number` | both | Timer end epoch — see [Time Tracking](#time-tracking) |

### Content Lines

The `contentLines` array renders additional text rows inside the card in **spacious** density. Each string becomes a separate line. In **tiny** density, content lines are hidden.

```tsx
{
  key: "deploy",
  title: "DEPLOY v2.4",
  status: { label: "Running", color: "cyan", spinning: true },
  contentLines: [
    "> docker build -t app:v2.4 .",
    "> kubectl apply -f deploy.yaml",
    "> Waiting for rollout...",
  ],
}
```

Cards with different-length `contentLines` arrays will have different visual heights. A card with 5 lines will be taller than a card with 2 lines, creating a heterogeneous layout.

---

## Time Tracking

The board has a built-in timer system controlled by two optional fields on each card: `startedAt` and `finishedAt`.

### Timer States

| `startedAt` | `finishedAt` | Card renders |
|---|---|---|
| `undefined` | `undefined` | **No time display** — the card shows no timer at all |
| `Date.now()` | `undefined` | **Live ticking clock** — updates every second |
| `Date.now()` | `Date.now()` | **Frozen timestamp** — shows start → finish |

The timer is always rendered as the **last row** of the card, in both density modes:

```
tiny:     14:30→14:37         (HH:MM→HH:MM, no spaces)
spacious: 14:30:12 → 14:37:05  (HH:MM:SS → HH:MM:SS)
```

### When to Start the Timer

The board does not manage card lifecycle — **you** decide when to assign `startedAt`. In a standard TODO → DOING → DONE flow:

```tsx
// When creating the card (TODO column):
// Do NOT set startedAt — the card shows no timer.
const card = {
  key: "task-1",
  title: "TASK 01",
  status: { label: "Pending", color: "gray" },
  // startedAt is undefined → no time display
};

// When the card moves to DOING:
// Set startedAt to begin the live clock.
card.startedAt = Date.now();
card.status = { label: "Running", color: "cyan", spinning: true };
// The card now shows: 14:30→14:30 (ticking every second)

// When the card moves to DONE:
// Set finishedAt to freeze the clock.
card.finishedAt = Date.now();
card.status = { label: "Done", color: "green" };
// The card now shows: 14:30→14:37 (frozen)
```

**Key insight:** cards without `startedAt` show **nothing** in the time row. This is intentional — cards waiting in a backlog or queue don't need elapsed time. The timer only appears once you explicitly set `startedAt`.

### Controlling Which Column Stops the Clock

The board is column-agnostic for timers. It doesn't know which column is "done" — it only reads `startedAt` and `finishedAt` from each card. **Any column can stop the clock** by having the consumer set `finishedAt` when the card enters that column.

```tsx
// Example: stop the clock when a card enters "REVIEW" (not "DONE")
function moveToReview(card: KanbanCardData) {
  card.finishedAt = Date.now();  // clock freezes here
  card.status = { label: "In Review", color: "magenta" };
}

// Example: 5-column pipeline — clock stops at "LIVE"
function moveToLive(card: KanbanCardData) {
  card.finishedAt = Date.now();
  card.status = { label: "Live", color: "green" };
}
```

You can also implement **selective timing** — start the timer in BUILD, stop it in DEPLOY, and leave it stopped through LIVE:

```tsx
const stages = {
  queue:  (card) => { /* no startedAt — no timer */ },
  build:  (card) => { card.startedAt = Date.now(); },
  test:   (card) => { /* timer keeps ticking from build */ },
  deploy: (card) => { card.finishedAt = Date.now(); },
  live:   (card) => { /* timer stays frozen at deploy time */ },
};
```

### Alternative: Measure Total Lifetime

If you want to track how long a card has existed (from creation, not from "doing"):

```tsx
// Set startedAt at creation — timer runs from the start
const card = {
  key: "task-1",
  title: "TASK 01",
  status: { label: "Pending", color: "gray" },
  startedAt: Date.now(),  // timer starts immediately
};
```

The choice is yours. The board renders whatever timestamps you provide.

---

## Card Detail Modal

The `CardDetailModal` component renders an interactive detail view for a single card. It **replaces** the board view — the board state is preserved in React state and restores when the modal closes. This ensures a clean, readable modal without transparency artifacts.

### Opening a Modal

Use the `useCardModal` hook to manage modal state, and conditionally render the modal **instead of** the board. The consumer is responsible for triggering `open()` — typically on **Enter** key in the `useInput` handler (see [Keyboard Navigation](#keyboard-navigation) for the full pattern).

```tsx
import {
  KanbanBoard,
  CardDetailModal,
  useCardModal,
  type ModalSection,
} from "ink-kanban-board";

function App() {
  const [focusedKey, setFocusedKey] = useState<string | null>("task-1");
  const { isOpen, card, open, close } = useCardModal();

  // Keyboard input — see "Keyboard Navigation" section for the full useInput example.
  // The key integration point: call open(cardData) on Enter, and pass
  // { isActive: !isOpen } to disable board navigation while the modal is open.

  const sections: ModalSection[] = [
    { type: "text",      label: "Notes",     value: notes, onSubmit: addNote },
    { type: "checklist", label: "Subtasks",  items,        onToggle: toggle },
    { type: "select",    label: "Priority",  options,      value: prio, onChange: setPrio },
    { type: "steps",     label: "Pipeline",  steps },
  ];

  return (
    <Box flexDirection="column">
      {isOpen && card ? (
        <CardDetailModal card={card} sections={sections} onClose={close} />
      ) : (
        <KanbanBoard columns={columns} focusedCardKey={focusedKey} />
      )}
    </Box>
  );
}
```

### Modal Sections

The `sections` array defines what appears inside the modal. Each section is a union type (`ModalSection`) with a `type` discriminator:

#### Text Section

Displays multi-line text with an optional input field for adding new lines:

```tsx
{
  type: "text",
  label: "📝 Notes",
  value: "Existing note text.\nSecond line.",
  placeholder: "Type a note...",
  onSubmit: (text) => {
    // Called when user types and presses Enter
    setNotes(prev => prev + "\n" + text);
  },
}
```

When `onSubmit` is provided, the section shows an interactive text input when focused. Without `onSubmit`, the section is read-only.

#### Checklist Section

Interactive checkbox list with toggle support:

```tsx
{
  type: "checklist",
  label: "☑ Subtasks",
  items: [
    { key: "a", label: "Design mockups",  checked: true },
    { key: "b", label: "Implement API",   checked: false },
    { key: "c", label: "Write tests",     checked: false },
  ],
  onToggle: (key, checked) => {
    // Called when user presses Space or Enter on an item
    updateSubtask(key, checked);
  },
}
```

Navigate items with **↑↓**, toggle with **Space** or **Enter**.

#### Select Section

Single-select from a list of options:

```tsx
{
  type: "select",
  label: "⚡ Priority",
  options: [
    { label: "Low",      value: "low" },
    { label: "Medium",   value: "medium" },
    { label: "High",     value: "high" },
    { label: "Critical", value: "critical" },
  ],
  value: "medium",  // currently selected
  onChange: (value) => {
    setPriority(value);
  },
}
```

Navigate with **↑↓**, select with **Enter**. The current selection shows a `●` indicator.

#### Steps Section

Visual pipeline/progress display with optional action callbacks:

```tsx
{
  type: "steps",
  label: "🔄 Pipeline",
  steps: [
    { key: "build",  label: "Build",  status: "done" },
    { key: "test",   label: "Test",   status: "active" },
    { key: "deploy", label: "Deploy", status: "pending" },
  ],
  onAction: (key) => {
    // Called when user presses Enter on a step
    advanceStep(key);
  },
}
```

Navigate steps with **←→**, trigger actions with **Enter**. Status icons: ✓ done, ◆ active, ○ pending, ✗ error.

### Modal Navigation

| Key | Action |
|---|---|
| **↑↓** | Navigate between sections (or items within checklist/select — overflows to next section) |
| **←→** | Navigate steps (steps section) |
| **Tab / Shift+Tab** | Jump between sections |
| **Enter** | Start editing (text) / toggle (checklist) / select option / trigger step action |
| **Space** | Toggle checkbox (checklist) |
| **Esc** | Exit edit mode (text input) or close the modal |

When editing a **text section**, all keys are captured for typing. Press **Esc** to stop editing and return to section navigation. The footer always shows context-sensitive shortcut hints.

---

## Focus & Navigation

### Focused Card

Pass `focusedCardKey` to highlight a specific card:

```tsx
<KanbanBoard
  columns={columns}
  focusedCardKey="task-3"  // this card gets a cyanBright bold border
/>
```

The focused card receives:
- `borderStyle: "bold"` (thicker border)
- `borderColor: "cyanBright"` (bright cyan, overriding `status.color`)

### Overflow & Scroll-into-View

When a column has more cards than `maxItemsPerColumn` (default: 5), hidden cards are indicated with `↑ N` / `↓ N` markers. If the focused card is outside the visible window, the view auto-scrolls to keep it centered.

```tsx
<KanbanBoard
  columns={columns}
  focusedCardKey={focusedKey}
  maxItemsPerColumn={4}  // show at most 4 cards per column
/>
```

### Keyboard Navigation

The board does **not** handle keyboard input — that's the consumer's responsibility via Ink's `useInput`. Here's the complete keyboard pattern including 2D navigation, modal opening, unfocus, and quit:

```tsx
import { useInput } from "ink";
import { useCardModal } from "ink-kanban-board";

const { isOpen, card, open, close } = useCardModal();

useInput((input, key) => {
  // Find current (col, row) from focusedKey
  let col = -1, row = -1;
  for (let c = 0; c < columns.length; c++) {
    const r = columns[c].cards.findIndex((card) => card.key === focusedKey);
    if (r !== -1) { col = c; row = r; break; }
  }

  if (key.downArrow || input === "j") {
    // Move down within column
    if (col >= 0) {
      const next = Math.min(columns[col].cards.length - 1, row + 1);
      setFocusedKey(columns[col].cards[next].key);
    }
  } else if (key.upArrow || input === "k") {
    // Move up within column
    if (col >= 0) {
      const next = Math.max(0, row - 1);
      setFocusedKey(columns[col].cards[next].key);
    }
  } else if (key.rightArrow || input === "l") {
    // Move to next column, preserving row position
    const nextCol = Math.min(columns.length - 1, col + 1);
    const target = columns[nextCol].cards;
    if (target.length > 0) {
      setFocusedKey(target[Math.min(row, target.length - 1)].key);
    }
  } else if (key.leftArrow || input === "h") {
    // Move to previous column, preserving row position
    const nextCol = Math.max(0, col - 1);
    const target = columns[nextCol].cards;
    if (target.length > 0) {
      setFocusedKey(target[Math.min(row, target.length - 1)].key);
    }
  } else if (key.return && focusedKey) {
    // Open card detail modal (see Card Detail Modal section)
    const cardData = columns[col]?.cards[row];
    if (cardData) open(cardData);
  } else if (key.escape) {
    setFocusedKey(null);
  } else if (input === "q") {
    process.exit(0);
  }
}, { isActive: !isOpen });  // disable board navigation while modal is open
```

> **Note:** The `{ isActive: !isOpen }` option disables board navigation while the modal is open. The modal handles its own keyboard input internally. See [Card Detail Modal](#card-detail-modal) for the full integration pattern.

---

## Progress Bar

When `showProgress` is `true` (the default), a progress summary bar renders above the columns:

```
[████▒▒····] 3/10 done • 2 active • 5 pending
```

The bar uses a convention:
- **Last column** → "done" count (filled `█`)
- **Middle columns** (all except first and last) → "active" count (half-fill `▒`)
- **First column** → "pending" count (empty `·`)

In tiny density, the bar is condensed: `[████▒▒····] 3/10`

To hide it: `<KanbanBoard columns={columns} showProgress={false} />`

---

## Adapting Domain Data

The board is intentionally decoupled from any domain. Use an adapter function to map your data:

```tsx
import type { KanbanCardData, KanbanColumn } from "ink-kanban-board";

// Your domain type
interface PipelineJob {
  id: string;
  name: string;
  stage: "queued" | "running" | "passed" | "failed";
  startTime?: Date;
  endTime?: Date;
  logs: string[];
}

// Adapter: PipelineJob → KanbanCardData
function toCard(job: PipelineJob): KanbanCardData {
  const statusMap = {
    queued:  { label: "Queued",  color: "gray" },
    running: { label: "Running", color: "cyan", spinning: true },
    passed:  { label: "Passed",  color: "green" },
    failed:  { label: "Failed",  color: "red" },
  };

  return {
    key: job.id,
    title: job.name.toUpperCase(),
    subtitle: job.name,
    status: statusMap[job.stage],
    startedAt: job.startTime?.getTime(),
    finishedAt: job.endTime?.getTime(),
    contentLines: job.logs.slice(-3),
    contextLine: job.stage === "failed" ? job.logs.at(-1) : undefined,
    contextIsError: job.stage === "failed",
  };
}

// Build columns from grouped jobs
function buildColumns(jobs: PipelineJob[]): KanbanColumn[] {
  return [
    { key: "queued",  title: "QUEUED",  tone: "warning", cards: jobs.filter(j => j.stage === "queued").map(toCard) },
    { key: "running", title: "RUNNING", tone: "accent",  cards: jobs.filter(j => j.stage === "running").map(toCard) },
    { key: "passed",  title: "PASSED",  tone: "success", cards: jobs.filter(j => j.stage === "passed").map(toCard) },
    { key: "failed",  title: "FAILED",  tone: "danger",  cards: jobs.filter(j => j.stage === "failed").map(toCard) },
  ];
}
```

---

## API Reference

### `<KanbanBoard />` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `KanbanColumn[]` | *required* | Columns to render |
| `focusedCardKey` | `string \| null` | `null` | Key of the focused card |
| `breakpoint` | `"compact" \| "medium" \| "wide"` | `"medium"` | Column layout direction |
| `density` | `"tiny" \| "spacious"` | `"tiny"` | Card detail level |
| `maxItemsPerColumn` | `number` | `5` | Max visible cards before overflow indicators |
| `showProgress` | `boolean` | `true` | Show progress summary bar |

### `<CardDetailModal />` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `card` | `KanbanCardData` | *required* | The card being inspected |
| `sections` | `ModalSection[]` | *required* | Interactive sections to render |
| `onClose` | `() => void` | *required* | Called when Esc is pressed |
| `title` | `string` | `card.title` | Title override for the modal header |

### `ModalSection` (Union Type)

| Type | Key Fields | Description |
|---|---|---|
| `ModalTextSection` | `value`, `onSubmit?`, `placeholder?` | Multi-line text display with optional input |
| `ModalChecklistSection` | `items`, `onToggle?` | Checkbox list with toggle support |
| `ModalSelectSection` | `options`, `value?`, `onChange?` | Single-select from options |
| `ModalStepsSection` | `steps`, `onAction?` | Pipeline/progress step display |

### `ChecklistItem`

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | yes | Unique identifier |
| `label` | `string` | yes | Display text |
| `checked` | `boolean` | yes | Whether the item is checked |

### `SelectOption`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Display text |
| `value` | `string` | yes | Value passed to onChange |

### `StepItem`

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | yes | Unique identifier |
| `label` | `string` | yes | Display text |
| `status` | `"pending" \| "active" \| "done" \| "error"` | yes | Visual status |

### `useCardModal()`

Returns `CardModalState`:

| Field | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Whether the modal is currently open |
| `card` | `KanbanCardData \| null` | The card being inspected |
| `open` | `(card: KanbanCardData) => void` | Open the modal for a card |
| `close` | `() => void` | Close the modal |

### `KanbanCardData`

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | yes | Unique identifier |
| `title` | `string` | yes | Card header label |
| `status` | `CardStatus` | yes | Status badge (label + color + spinning) |
| `subtitle` | `string` | no | Secondary text (spacious only) |
| `progress` | `number` (0–1) | no | Progress bar value (spacious only) |
| `metadata` | `MetadataItem[]` | no | Dot-separated metadata line (spacious only) |
| `contextLine` | `string` | no | Bottom context line (spacious only) |
| `contextIsError` | `boolean` | no | Render context line in red |
| `isPreview` | `boolean` | no | Dim the card as a placeholder |
| `contentLines` | `string[]` | no | Variable-height content rows (spacious only) |
| `startedAt` | `number` | no | Timer start — epoch ms |
| `finishedAt` | `number` | no | Timer end — epoch ms |

### `CardStatus`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Badge text ("Running", "Done", "Error") |
| `color` | `string` | yes | Ink color — also controls card border color |
| `spinning` | `boolean` | no | Show a spinner next to the label |

### `MetadataItem`

| Field | Type | Required | Description |
|---|---|---|---|
| `label` | `string` | yes | Display text |
| `color` | `string` | no | Ink color override (default: `"gray"`) |
| `dim` | `boolean` | no | Render with dimColor |

### `KanbanColumn`

| Field | Type | Required | Description |
|---|---|---|---|
| `key` | `string` | yes | Unique identifier |
| `title` | `string` | yes | Column header (count appended: "TODO (3)") |
| `tone` | `Tone` | yes | Border/header color: `"neutral"` · `"accent"` · `"success"` · `"warning"` · `"danger"` |
| `cards` | `KanbanCardData[]` | yes | Cards in this column |

### `Tone`

`"neutral"` | `"accent"` | `"success"` | `"warning"` | `"danger"`

### `TerminalBreakpoint`

`"compact"` | `"medium"` | `"wide"`

### `LayoutDensity`

`"tiny"` | `"spacious"`

### `useTerminalSize()`

Returns `TerminalViewport`:

| Field | Type | Description |
|---|---|---|
| `width` | `number` | Terminal columns |
| `height` | `number` | Terminal rows |
| `breakpoint` | `TerminalBreakpoint` | Derived from width |
| `density` | `LayoutDensity` | Derived from width × height |
| `isShort` | `boolean` | `true` when height < 34 |

### Exported Components

| Export | Description |
|---|---|
| `KanbanBoard` | Main board component |
| `KanbanCard` | Individual card (used internally, exported for advanced layouts) |
| `CardDetailModal` | Interactive modal overlay for card details |
| `Panel` | Bordered container with tone coloring |
| `StatCard` | Label + value display card |
| `Pill` | Colored label badge |
| `useTerminalSize` | Terminal measurement hook |
| `useCardModal` | Modal open/close state management hook |

---

## Examples

Run any example with the corresponding script:

| Script | Description |
|---|---|
| `npm run dev` | Interactive demo — tasks move through TODO → DOING → DONE |
| `npm run demo:sim` | Same as `dev` (alias) |
| `npm run demo:minimal` | Static board, no state — minimal quick start |
| `npm run demo:hetero` | Cards with different content sizes (spacious mode) |
| `npm run demo:focus` | Keyboard focus navigation with overflow indicators |
| `npm run demo:pipeline` | 5-column CI/CD pipeline with animated progression |
| `npm run demo:logs` | Streaming `contentLines` — live tail effect |
| `npm run demo:modal` | Card detail modal — Enter to open, interactive sections |

---

## License

MIT
