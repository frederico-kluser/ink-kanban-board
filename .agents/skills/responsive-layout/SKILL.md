---
name: responsive-layout
description: >-
  Sistema de breakpoints e density do terminal com thresholds específicos
  (150/110 cols, 45 rows). Use ao ajustar layout responsivo ou viewport.
  Não use para API de componentes ou tipos.
metadata:
  version: "1.0.0"
  last-reviewed: "2026-04-15"
paths: "src/hooks/use-terminal-size.ts, src/kanban-board.tsx, src/kanban-card.tsx"
---

# Responsive Layout

## Goal

Documentar o sistema de layout responsivo que adapta o board ao tamanho
do terminal. Inclui breakpoints de largura, modos de densidade, e como
cada componente se comporta em cada combinação.

## Boundaries

**Fazer:**

- Consultar esta skill ao modificar thresholds de breakpoint/density
- Seguir as regras de adaptação ao criar novos elementos visuais
- Testar em terminais de diferentes tamanhos (80x24, 120x40, 200x60)

**Não fazer:**

- Hardcodar larguras absolutas em componentes
- Alterar thresholds sem testar nos 3 breakpoints
- Criar um novo modo density sem atualizar todos os componentes que o usam
- Ignorar o modo "tiny" — é o default e o mais usado

## Breakpoints

O hook `useTerminalSize()` retorna `TerminalViewport`:

```typescript
interface TerminalViewport {
  width: number;        // stdout.columns (default: 80)
  height: number;       // stdout.rows (default: 24)
  breakpoint: TerminalBreakpoint;
  density: LayoutDensity;
  isShort: boolean;     // height < 34
}
```

### Width Breakpoints (column layout direction)

| Breakpoint | Width      | Column Direction |
|-----------|------------|-----------------|
| `compact` | < 110 cols | `column` (stacked vertically) |
| `medium`  | 110-149    | `row` (side by side) |
| `wide`    | ≥ 150      | `row` (side by side) |

### Density (detail level)

| Density    | Condition         | Chrome Level |
|-----------|-------------------|-------------|
| `spacious` | ≥ 150 cols AND ≥ 45 rows | Full: borders round, padding, subtitles, progress bars, metadata, contentLines, full timestamps |
| `tiny`     | Everything else    | Minimal: borders single, no padding, title + status only, short timestamps |

## Comportamento por Density

### Modo Tiny (default)

- Card: `borderStyle="single"`, `paddingX=0, paddingY=0`
- Mostra apenas: título (max 18 chars) + status label + timestamp curto (HH:MM→HH:MM)
- `subtitle`, `progress`, `metadata`, `contextLine`, `contentLines` → NÃO renderizados
- Board: `gap=0` entre cards e colunas
- ProgressSummary: bar de 12 chars + `done/total`
- Panel: `paddingX=0, paddingY=0`, sem subtitle, sem footer

### Modo Spacious

- Card: `borderStyle="round"`, `paddingX=1, paddingY=0`
- Mostra tudo: título (Pill com borda), subtitle, progress bar (14 chars),
  metadata (dot-separated), contextLine, contentLines, timestamp completo (HH:MM:SS → HH:MM:SS)
- Board: `gap=1` entre cards e colunas
- ProgressSummary: bar de 24 chars + stats detalhados
- Panel: `paddingX=1, paddingY=1`, com subtitle e footer

## Timer (startedAt / finishedAt)

- Quando `startedAt` definido e `finishedAt` ausente: timer vivo (ticks 1s via `useNow` hook)
- Quando ambos definidos: timestamp estático frozen
- Formato tiny: `HH:MM→HH:MM`
- Formato spacious: `HH:MM:SS → HH:MM:SS`

## Overflow / Scroll Virtual

`maxItemsPerColumn` (default 5) controla quantos cards visíveis por coluna.
Quando excedido:

1. `sliceAroundFocus` calcula janela visível centrada no `focusedCardKey`
2. Cards escondidos acima → `↑ N` indicator
3. Cards escondidos abaixo → `↓ N` indicator
4. Sem focusedCardKey → mostra os primeiros N cards

## Gotchas

- O breakpoint default quando `stdout` não disponível é 80×24 (tiny, compact)
- `isShort` (height < 34) é exposto mas NÃO altera density automaticamente —
  é um flag para o consumer ajustar `maxItemsPerColumn` se necessário
- `useTerminalSize` escuta `stdout.on("resize")` — funciona em terminais reais
  mas NÃO em pipes/redirects onde stdout não é um TTY
- `compact` breakpoint empilha colunas verticalmente — com muitas colunas
  pode ultrapassar a altura do terminal
