---
name: component-api
description: >-
  Define os type contracts e composição dos componentes KanbanBoard, KanbanCard,
  Panel, Pill, StatCard. Use ao criar/modificar componentes ou tipos.
  Não use para layout responsivo ou exemplos.
metadata:
  version: "1.0.0"
  last-reviewed: "2026-04-15"
paths: "src/*.tsx, src/*.ts, src/ui/*.tsx"
---

# Component API

## Goal

Documentar os contratos de tipos, hierarquia de componentes e regras de
composição do ink-kanban-board. Garante que alterações na API pública
mantêm compatibilidade e seguem os padrões estabelecidos.

## Boundaries

**Fazer:**

- Consultar esta skill ao adicionar/modificar props de componentes
- Seguir os type contracts ao criar novos campos em KanbanCard
- Manter a cadeia de exports via `src/index.ts`
- Usar interfaces para contratos públicos, type aliases para unions

**Não fazer:**

- Adicionar campos domain-specific aos tipos genéricos
- Criar componentes com classes (apenas function components)
- Exportar tipos/componentes fora do barrel `src/index.ts`
- Adicionar `ink` ou `react` como dependency (são peer dependencies)

## Type Contracts

### KanbanCard (unidade de dados primária)

```typescript
interface KanbanCard {
  key: string;              // Chave React (obrigatório)
  title: string;            // Label no header (ex: "TASK 01")
  subtitle?: string;        // Texto secundário abaixo do título
  status: CardStatus;       // Badge de status (label + color + spinning?)
  progress?: number;        // 0-1, renderiza barra de progresso em spacious
  metadata?: MetadataItem[];// Itens separados por " • "
  contextLine?: string;     // Linha de log/contexto no rodapé
  contextIsError?: boolean; // true → contextLine em vermelho
  isPreview?: boolean;      // true → card com estilo dimmed (placeholder)
  contentLines?: string[];  // Linhas extras em spacious (altura variável)
  startedAt?: number;       // Epoch ms, mostra timeline HH:MM→HH:MM
  finishedAt?: number;      // Epoch ms, congela o timer quando definido
}
```

### CardStatus

```typescript
interface CardStatus {
  label: string;     // Texto do badge ("Running", "Done", "Error")
  color: string;     // Cor Ink ("cyan", "green", "red")
  spinning?: boolean;// true → Spinner animado ao lado do label
}
```

### KanbanColumn

```typescript
interface KanbanColumn {
  key: string;        // Chave React
  title: string;      // Header da coluna (count é adicionado automaticamente)
  tone: Tone;         // "neutral" | "accent" | "success" | "warning" | "danger"
  cards: KanbanCard[];// Cards nesta coluna
}
```

### KanbanBoardProps

```typescript
interface KanbanBoardProps {
  columns: KanbanColumn[];              // Colunas (qualquer quantidade)
  focusedCardKey?: string | null;       // Card com foco visual
  breakpoint?: TerminalBreakpoint;      // "compact" | "medium" | "wide"
  density?: LayoutDensity;             // "tiny" | "spacious"
  maxItemsPerColumn?: number;          // Default: 5 (overflow → ↑↓ indicators)
  showProgress?: boolean;             // Default: true (barra de progresso geral)
}
```

### Tone (cores semânticas)

```typescript
type Tone = "neutral" | "accent" | "success" | "warning" | "danger";
// Mapeamento: neutral→gray, accent→cyan, success→green, warning→yellow, danger→red
```

## Hierarquia de Componentes

```
<KanbanBoard>           → src/kanban-board.tsx
  <ProgressSummary>     → (internal) barra [████▒▒··] done/total
  <ColumnView>          → (internal) wrapper com Panel + overflow
    <Panel>             → src/ui/panel.tsx (border + header + footer)
      <KanbanCard>      → src/kanban-card.tsx (tiny ou spacious)
        <Pill>          → src/ui/panel.tsx (label com borda)
        <Spinner>       → @inkjs/ui (quando status.spinning)
```

- `ColumnView` e `ProgressSummary` são componentes internos (não exportados)
- `Panel`, `StatCard` e `Pill` são exportados como primitivas reutilizáveis
- `KanbanCard` (componente) é exportado; `KanbanCard` (tipo) é exportado como `KanbanCardData`

## Regras de Export

O barrel `src/index.ts` exporta exatamente:

- **Componentes**: `KanbanBoard`, `KanbanCard`, `Panel`, `StatCard`, `Pill`
- **Hooks**: `useTerminalSize`
- **Types**: `KanbanCardData`, `CardStatus`, `MetadataItem`, `KanbanColumn`,
  `KanbanBoardProps`, `Tone`, `TerminalBreakpoint`, `LayoutDensity`,
  `TerminalViewport`, `KanbanCardProps`

Ao adicionar um novo export, atualizar `src/index.ts` E o campo `exports`
em `package.json` se for um novo entrypoint.

## Gotchas

- O tipo `KanbanCard` (interface em types.ts) é re-exportado como
  `KanbanCardData` para evitar conflito com o componente `KanbanCard`
- `progress` deve ser 0-1 (não 0-100) — a renderização multiplica por 100
- `contentLines` só é visível em density `"spacious"` — em `"tiny"` é ignorado
- Cards com `isPreview: true` usam `borderColor: "gray"` independente do status
- `maxItemsPerColumn` ativa scroll virtual com `sliceAroundFocus` — não é CSS overflow
