# ink-kanban-board

A modular, responsive Kanban board component for [Ink](https://github.com/vadimdemedes/ink) terminal applications.

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ TODO (3)         │ │ DOING (2)        │ │ DONE (4)         │
│ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │TASK 01 Pend. │ │ │ │TASK 04 ⠋ Run │ │ │ │TASK 07 Done  │ │
│ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │
│ ┌──────────────┐ │ │ ┌──────────────┐ │ │ ┌──────────────┐ │
│ │TASK 02 Pend. │ │ │ │TASK 05 ⠋ Run │ │ │ │TASK 08 Done  │ │
│ └──────────────┘ │ │ └──────────────┘ │ │ └──────────────┘ │
└──────────────────┘ └──────────────────┘ └──────────────────┘
[████▒▒····] 4/9 done • 2 active • 3 pending
```

## Features

- **Responsive layout** — adapts to terminal width (compact, medium, wide breakpoints)
- **Density modes** — `tiny` (single-line cards) and `spacious` (multi-line with progress bars)
- **Focus tracking** — highlight a card and auto-scroll columns to keep it visible
- **Overflow indicators** — `↑ 3` / `↓ 5` when cards exceed the column limit
- **Progress bar** — per-card and board-level progress visualization
- **Spinner support** — animated status indicators for active cards
- **Any number of columns** — not limited to TODO/DOING/DONE
- **Zero domain coupling** — generic types, bring your own data model

## Installation

```bash
npm install ink-kanban-board
```

Peer dependencies (you must have these in your project):

```bash
npm install ink react
```

## Quick Start

```tsx
import React from "react";
import { render } from "ink";
import { KanbanBoard, useTerminalSize, type KanbanColumn } from "ink-kanban-board";

function App() {
  const { breakpoint, density } = useTerminalSize();

  const columns: KanbanColumn[] = [
    {
      key: "todo",
      title: "TODO",
      tone: "warning",
      cards: [
        {
          key: "task-1",
          title: "TASK 01",
          subtitle: "Refactor auth module",
          status: { label: "Pending", color: "gray" },
        },
      ],
    },
    {
      key: "doing",
      title: "DOING",
      tone: "accent",
      cards: [
        {
          key: "task-2",
          title: "TASK 02",
          subtitle: "Fix login page",
          status: { label: "Running", color: "cyan", spinning: true },
          progress: 0.65,
        },
      ],
    },
    {
      key: "done",
      title: "DONE",
      tone: "success",
      cards: [
        {
          key: "task-3",
          title: "TASK 03",
          subtitle: "Update README",
          status: { label: "Done", color: "green" },
        },
      ],
    },
  ];

  return (
    <KanbanBoard
      columns={columns}
      breakpoint={breakpoint}
      density={density}
    />
  );
}

render(<App />);
```

## Running the Demo

Clone the repository and run the interactive demo:

```bash
git clone https://github.com/your-org/ink-kanban-board.git
cd ink-kanban-board
npm install
npm run dev
```

The demo simulates tasks moving through TODO → DOING → DONE with animated spinners and progress bars. Use `↑↓` or `j/k` to navigate, `Esc` to unfocus, `q` to quit.

## API Reference

### `<KanbanBoard>`

The main board component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `KanbanColumn[]` | *required* | Array of columns to render |
| `focusedCardKey` | `string \| null` | `null` | Key of the focused card |
| `breakpoint` | `TerminalBreakpoint` | `"medium"` | Layout breakpoint (`compact`, `medium`, `wide`) |
| `density` | `LayoutDensity` | `"tiny"` | Card detail level (`tiny`, `spacious`) |
| `maxItemsPerColumn` | `number` | `5` | Max visible cards before overflow indicators |
| `showProgress` | `boolean` | `true` | Show the progress summary bar |

### `<KanbanCard>`

Individual card component (used internally, but exported for custom layouts).

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `card` | `KanbanCardData` | *required* | Card data object |
| `focused` | `boolean` | `false` | Whether this card is focused |
| `density` | `LayoutDensity` | `"tiny"` | Layout density |

### `<Panel>`

A bordered container with title and optional footer.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | — | Panel header text |
| `subtitle` | `string` | — | Secondary text (hidden in tiny density) |
| `tone` | `Tone` | `"neutral"` | Border color tone |
| `footer` | `ReactNode` | — | Footer content (hidden in tiny density) |
| `density` | `LayoutDensity` | `"tiny"` | Layout density |

### `<Pill>`

An inline label badge.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | *required* | Badge text |
| `tone` | `Tone` | `"neutral"` | Color tone |
| `strong` | `boolean` | `false` | Bold text |
| `density` | `LayoutDensity` | `"tiny"` | Layout density |

### `<StatCard>`

A card for displaying a single stat with label and value.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | *required* | Stat label |
| `value` | `string` | *required* | Stat value |
| `detail` | `string` | — | Additional detail text |
| `tone` | `Tone` | `"neutral"` | Color tone |
| `density` | `LayoutDensity` | `"tiny"` | Layout density |

### `useTerminalSize()`

Hook that tracks terminal dimensions and derives responsive breakpoints.

```tsx
const { width, height, breakpoint, density, isShort } = useTerminalSize();
```

Returns `TerminalViewport`:

| Field | Type | Description |
|-------|------|-------------|
| `width` | `number` | Terminal columns |
| `height` | `number` | Terminal rows |
| `breakpoint` | `TerminalBreakpoint` | `compact` (<110), `medium` (110-149), `wide` (≥150) |
| `density` | `LayoutDensity` | `spacious` (≥150×45) or `tiny` (everything else) |
| `isShort` | `boolean` | `true` when height < 34 |

## Types

### `KanbanCardData`

```typescript
interface KanbanCardData {
  key: string;             // Unique key for React
  title: string;           // Card header (e.g. "TASK 01")
  subtitle?: string;       // Secondary text (e.g. file path)
  status: CardStatus;      // Status badge
  progress?: number;       // 0-1, renders progress bar in spacious mode
  metadata?: MetadataItem[]; // Dot-separated info line
  contextLine?: string;    // Bottom log/error line
  contextIsError?: boolean; // Renders contextLine in red
  isPreview?: boolean;     // Dimmed placeholder styling
}
```

### `CardStatus`

```typescript
interface CardStatus {
  label: string;     // e.g. "Running", "Done"
  color: string;     // Ink color name
  spinning?: boolean; // Show spinner animation
}
```

### `KanbanColumn`

```typescript
interface KanbanColumn {
  key: string;         // Unique key for React
  title: string;       // Column header (count is appended)
  tone: Tone;          // Border color tone
  cards: KanbanCardData[];
}
```

### `Tone`

```typescript
type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
```

## Density & Breakpoint System

The board automatically adapts to terminal size:

| Terminal Size | Breakpoint | Density | Behavior |
|--------------|------------|---------|----------|
| < 110 cols | `compact` | `tiny` | Columns stacked vertically, single-line cards |
| 110–149 cols | `medium` | `tiny` | Columns side-by-side, single-line cards |
| ≥ 150 cols, < 45 rows | `wide` | `tiny` | Wide layout, single-line cards |
| ≥ 150 cols, ≥ 45 rows | `wide` | `spacious` | Full detail: progress bars, metadata, context |

Use `useTerminalSize()` to get the current breakpoint and density, then pass them to `<KanbanBoard>`.

## Adapting from Your Domain Types

The package ships with no domain-specific types. You provide a function that maps your data to `KanbanColumn[]`. See [`examples/pi-orq-adapter.ts`](examples/pi-orq-adapter.ts) for a complete example of mapping pi-orq's `AgentStatus` objects.

Pattern:

```tsx
function myDataToColumns(tasks: MyTask[]): KanbanColumn[] {
  const todo = tasks.filter(t => t.state === "pending").map(taskToCard);
  const doing = tasks.filter(t => t.state === "running").map(taskToCard);
  const done = tasks.filter(t => t.state === "done").map(taskToCard);

  return [
    { key: "todo", title: "TODO", tone: "warning", cards: todo },
    { key: "doing", title: "DOING", tone: "accent", cards: doing },
    { key: "done", title: "DONE", tone: "success", cards: done },
  ];
}

function taskToCard(task: MyTask): KanbanCardData {
  return {
    key: task.id,
    title: task.name,
    subtitle: task.description,
    status: { label: task.state, color: task.state === "running" ? "cyan" : "gray" },
  };
}
```

## License

MIT
