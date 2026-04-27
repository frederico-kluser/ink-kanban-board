# ink-kanban-board

A modular, responsive Kanban board component for Ink terminal applications.
Renders N columns with cards that adapt layout based on terminal dimensions.

## Build & Run

```bash
# Install dependencies
npm install

# Build (TypeScript → dist/)
npm run build

# Type-check without emitting
npm run typecheck

# Run interactive demo
npm run dev

# Run specific demos
npm run demo:minimal     # static 3-column board
npm run demo:hetero      # cards with different content heights
npm run demo:focus       # keyboard navigation + overflow indicators
npm run demo:pipeline    # 5-column CI/CD pipeline simulation
npm run demo:logs        # streaming contentLines (tail -f effect)
npm run demo:modal       # card detail modal with interactive sections
```

## Conventions

- **Naming**: camelCase for functions/variables, PascalCase for components/types, kebab-case for files
- **Imports**: ESM-only (`.js` extensions in imports, even for `.ts` sources)
- **Components**: function components only, no classes
- **Types**: interfaces for public contracts, type aliases for unions/primitives
- **Exports**: single barrel file `src/index.ts` — all public API goes through it
- **JSX**: `react-jsx` transform (no `import React from "react"` needed, but kept explicit)
- **Error handling**: no try/catch in components — rely on React error boundaries upstream

## Architecture

```
src/
├── index.ts              # Public API barrel (components + types + hooks)
├── types.ts              # All shared type definitions (zero runtime code)
├── kanban-board.tsx       # Top-level <KanbanBoard> + internal ColumnView, ProgressSummary
├── kanban-card.tsx        # <KanbanCard> with tiny/spacious density modes
├── card-detail-modal.tsx  # <CardDetailModal> with interactive sections
├── hooks/
│   ├── use-terminal-size.ts  # useTerminalSize() → TerminalViewport
│   └── use-card-modal.ts     # useCardModal() → CardModalState
└── ui/
    └── panel.tsx          # Reusable primitives: Panel, StatCard, Pill

examples/
├── minimal.tsx            # Simplest static board
├── demo.tsx               # Interactive simulation with keyboard nav
├── heterogeneous-cards.tsx # Variable-height cards in spacious mode
├── focus-navigation.tsx   # Focus tracking + overflow demo
├── multi-pipeline.tsx     # 5-column CI/CD pipeline
├── live-logs.tsx          # Streaming contentLines
├── card-detail-modal.tsx  # Interactive modal with text/checklist/select/steps
└── pi-orq-adapter.ts     # Reference adapter for pi-orq integration
```

**Dependency direction**: types.ts ← components ← hooks/ui (leaf nodes).
Components never import from `examples/`. Examples import from `src/index.js`.

## Rules

- ESM-only (`"type": "module"` in package.json) — never use CommonJS
- `ink` and `react` are peer dependencies — never add them to `dependencies`
- Types in `types.ts` are domain-agnostic — never add domain-specific fields
- Every public export must go through `src/index.ts`
- Cards adapt to density, not the other way around — never hardcode layout sizes
- `@inkjs/ui` is the only runtime dependency — keep the dependency footprint minimal

## References (carregue sob demanda)

- Spec opencode / cleanup history: `agent-skills-opencode-spec.md`
