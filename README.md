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

- **Responsive layout** — adapts to terminal width (`compact`, `medium`, `wide` breakpoints)
- **Two density modes** — `tiny` (compact, name-only cards) and `spacious` (extended multi-line cards)
- **Dynamic content lines** — `contentLines` array lets each card show custom rows in extended mode
- **Variable card heights** — cards with different `contentLines` lengths render at different sizes
- **Real-time updates** — all card fields (title, contentLines, status, progress) update live via React state
- **Focus tracking** — highlight a card and auto-scroll columns to keep it visible
- **Overflow indicators** — `↑ 3` / `↓ 5` when cards exceed the column limit
- **Progress bars** — per-card and board-level progress visualization
- **Spinner support** — animated status indicators for active cards
- **Any number of columns** — not limited to TODO/DOING/DONE
- **Zero domain coupling** — generic types, bring your own data model

## Installation

```bash
npm install ink-kanban-board
```

Peer dependencies:

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
      key: "todo", title: "TODO", tone: "warning",
      cards: [
        { key: "t1", title: "TASK 01", status: { label: "Pending", color: "gray" } },
      ],
    },
    {
      key: "doing", title: "DOING", tone: "accent",
      cards: [
        { key: "t2", title: "TASK 02", status: { label: "Running", color: "cyan", spinning: true }, progress: 0.65 },
      ],
    },
    {
      key: "done", title: "DONE", tone: "success",
      cards: [
        { key: "t3", title: "TASK 03", status: { label: "Done", color: "green" } },
      ],
    },
  ];

  return <KanbanBoard columns={columns} breakpoint={breakpoint} density={density} />;
}

render(<App />);
```

## Card Content: Compact vs Extended

The board has two density modes that control how much information each card displays.

### Compact mode (`density="tiny"`)

The card **title**, **status badge**, and **time line** are shown. Everything else is hidden. This is ideal for small terminals or high-density boards.

```
┌─────────────────────┐
│ TASK 01  Pending     │
│ 14:30→14:32          │
└─────────────────────┘
```

### Extended mode (`density="spacious"`)

Cards show all available fields. The `contentLines` array lets you define custom rows of text — each entry becomes a separate line inside the card. Cards with more lines are taller.

```
╭─────────────────────────────────╮
│ ╭──────╮                        │
│ │TASK 01│          ⠋ Running    │
│ ╰──────╯                        │
│ Refactor auth module             │
│ [████████████··] 85%             │
│ env: prod • region: us-east-1   │
│ Step 4/6: Running tests...       │
│ > docker build -t app:v2.4 .     │  ← contentLines[0]
│ > kubectl apply -f deploy.yaml   │  ← contentLines[1]
│ > Waiting for rollout...         │  ← contentLines[2]
│ 14:30:00 → 14:42:34             │  ← time line (always last)
╰─────────────────────────────────╯
```

### Defining content lines

Pass a `contentLines` string array on the card data. Each element renders as a separate text row:

```tsx
const card: KanbanCardData = {
  key: "deploy-1",
  title: "DEPLOY v2.4",
  subtitle: "Production deployment",
  status: { label: "Running", color: "cyan", spinning: true },
  progress: 0.65,
  contentLines: [
    "> docker build -t app:v2.4 .",
    "> kubectl apply -f deploy.yaml",
    "> Waiting for rollout...",
  ],
};
```

Cards without `contentLines` (or with an empty array) render normally — this field is fully optional and additive.

## Time Tracking

Every card can display a live timer as its **last row** — visible in both compact and extended modes.

Set `startedAt` to a `Date.now()` epoch timestamp when the card is created. The timer ticks every second, showing elapsed time. When the work finishes, set `finishedAt` to freeze the display.

```tsx
// Card with a live ticking timer
{
  key: "task-1",
  title: "BUILD",
  status: { label: "Running", color: "cyan", spinning: true },
  startedAt: Date.now(),       // timer starts now
  // finishedAt is absent → time ticks every second
}

// Card with a frozen timer
{
  key: "task-2",
  title: "LINT",
  status: { label: "Done", color: "green" },
  startedAt: 1713200000000,    // when it started
  finishedAt: 1713200045000,   // when it finished — timer freezes
}
```

Display format:
- **Compact** (`tiny`): `HH:MM→HH:MM` (e.g. `14:30→14:32`)
- **Extended** (`spacious`): `HH:MM:SS → HH:MM:SS` (e.g. `14:30:00 → 14:32:15`)

The timer updates automatically for all active cards simultaneously — no extra hooks or intervals needed from the consumer.

## Dynamic Updates

All card fields update in real time via React state. To update a card's title, content lines, status, or any other field, simply update your state — React handles the re-render.

```tsx
import React, { useState, useEffect } from "react";
import { render } from "ink";
import { KanbanBoard, useTerminalSize, type KanbanColumn } from "ink-kanban-board";

function LiveApp() {
  const { breakpoint, density } = useTerminalSize();
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(1, p + 0.1);
        setLogs((prev) => [...prev.slice(-2), `Processing... ${Math.round(next * 100)}%`]);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const columns: KanbanColumn[] = [
    {
      key: "doing", title: "DOING", tone: "accent",
      cards: [
        {
          key: "task-1",
          title: `BUILD [${Math.round(progress * 100)}%]`,  // title updates dynamically
          subtitle: "Compiling source files",
          status: {
            label: progress >= 1 ? "Done" : "Building",
            color: progress >= 1 ? "green" : "cyan",
            spinning: progress < 1,
          },
          progress,
          contentLines: logs,  // grows over time → card height increases
        },
      ],
    },
  ];

  return <KanbanBoard columns={columns} breakpoint={breakpoint} density={density} />;
}

render(<LiveApp />);
```

Key points:
- **Title** can change every render (e.g., append a percentage)
- **`contentLines`** can grow, shrink, or replace entries — the card resizes automatically
- **Status**, **progress**, **metadata** — all fields are reactive
- No special API needed — standard React `useState` / `useEffect` patterns work

## Cards with Different Sizes

Each card can have a different number of `contentLines`, producing cards of different visual heights within the same column. This is useful when cards represent heterogeneous work items:

```tsx
const columns: KanbanColumn[] = [
  {
    key: "tasks", title: "TASKS", tone: "accent",
    cards: [
      {
        key: "minimal",
        title: "LINT FIX",
        status: { label: "Done", color: "green" },
        // No contentLines — smallest card
      },
      {
        key: "medium",
        title: "DB MIGRATION",
        subtitle: "migrate_v41.sql",
        status: { label: "Done", color: "green" },
        contentLines: [
          "ALTER TABLE users ADD INDEX idx_email;",
          "ALTER TABLE orders ADD INDEX idx_created;",
        ],
      },
      {
        key: "large",
        title: "DATA SYNC",
        subtitle: "Syncing warehouse tables",
        status: { label: "Streaming", color: "cyan", spinning: true },
        progress: 0.32,
        contentLines: [
          "users       ████████░░░░ 67%",
          "orders      ████░░░░░░░░ 33%",
          "products    ██░░░░░░░░░░ 18%",
          "analytics   ░░░░░░░░░░░░  2%",
          "sessions    — pending",
        ],
      },
    ],
  },
];
```

See [`examples/heterogeneous-cards.tsx`](examples/heterogeneous-cards.tsx) for a full runnable example.

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
| `breakpoint` | `TerminalBreakpoint` | `compact` (<110), `medium` (110–149), `wide` (≥150) |
| `density` | `LayoutDensity` | `spacious` (≥150×45) or `tiny` (everything else) |
| `isShort` | `boolean` | `true` when height < 34 |

## Types

### `KanbanCardData`

```typescript
interface KanbanCardData {
  key: string;              // Unique key for React
  title: string;            // Card header — only field shown in compact mode
  subtitle?: string;        // Secondary text (spacious only)
  status: CardStatus;       // Status badge (shown in both modes)
  progress?: number;        // 0–1, renders progress bar (spacious only)
  metadata?: MetadataItem[];// Dot-separated info line (spacious only)
  contextLine?: string;     // Bottom log/error line (spacious only)
  contextIsError?: boolean; // Renders contextLine in red
  isPreview?: boolean;      // Dimmed placeholder styling
  contentLines?: string[];  // Custom text rows (spacious only) — variable card height
  startedAt?: number;       // Epoch ms — enables time line (both modes)
  finishedAt?: number;      // Epoch ms — freezes the timer when set
}
```

### `CardStatus`

```typescript
interface CardStatus {
  label: string;      // e.g. "Running", "Done"
  color: string;      // Ink color name
  spinning?: boolean; // Show spinner animation
}
```

### `MetadataItem`

```typescript
interface MetadataItem {
  label: string;    // Display text
  color?: string;   // Optional color override (default: "gray")
  dim?: boolean;    // Render with dimColor
}
```

### `KanbanColumn`

```typescript
interface KanbanColumn {
  key: string;           // Unique key for React
  title: string;         // Column header (count is appended automatically)
  tone: Tone;            // Border color tone
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
| < 110 cols | `compact` | `tiny` | Columns stacked vertically, name-only cards |
| 110–149 cols | `medium` | `tiny` | Columns side-by-side, name-only cards |
| ≥ 150 cols, < 45 rows | `wide` | `tiny` | Wide layout, name-only cards |
| ≥ 150 cols, ≥ 45 rows | `wide` | `spacious` | Full detail: contentLines, progress bars, metadata |

Use `useTerminalSize()` to get the current breakpoint and density, then pass them to `<KanbanBoard>`. You can also override `density` manually to force a specific mode.

## Adapting from Your Domain Types

The package ships with no domain-specific types. Provide a function that maps your data to `KanbanColumn[]`:

```tsx
function myDataToColumns(tasks: MyTask[]): KanbanColumn[] {
  return [
    { key: "todo", title: "TODO", tone: "warning", cards: tasks.filter(t => t.state === "pending").map(taskToCard) },
    { key: "doing", title: "DOING", tone: "accent", cards: tasks.filter(t => t.state === "running").map(taskToCard) },
    { key: "done", title: "DONE", tone: "success", cards: tasks.filter(t => t.state === "done").map(taskToCard) },
  ];
}

function taskToCard(task: MyTask): KanbanCardData {
  return {
    key: task.id,
    title: task.name,
    subtitle: task.description,
    status: { label: task.state, color: task.state === "running" ? "cyan" : "gray" },
    contentLines: task.logs,  // pass any string[] for extended detail rows
  };
}
```

See [`examples/pi-orq-adapter.ts`](examples/pi-orq-adapter.ts) for a complete real-world adapter mapping pi-orq's `AgentStatus` objects.

## Examples

| Example | Command | Description |
|---------|---------|-------------|
| [Interactive demo](examples/demo.tsx) | `npm run dev` | Simulated tasks with dynamic titles, live contentLines, and progress |
| [Heterogeneous cards](examples/heterogeneous-cards.tsx) | `npm run demo:hetero` | Cards with different sizes, field combinations, and content line counts |
| [pi-orq adapter](examples/pi-orq-adapter.ts) | — | Reference adapter mapping domain types to KanbanColumn[] |

## License

MIT
