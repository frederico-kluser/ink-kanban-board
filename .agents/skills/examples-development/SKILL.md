---
name: examples-development
description: >-
  Workflow de desenvolvimento, scripts npm e criação de exemplos demo para
  ink-kanban-board. Use ao criar demos ou modificar o dev workflow.
  Não use para API de componentes ou layout responsivo.
metadata:
  version: "2.0.0"
  last-reviewed: "2026-04-15"
paths: "examples/*.tsx, examples/*.ts, package.json"
---

# Examples & Development

## Goal

Documentar o workflow de desenvolvimento, os scripts de demo disponíveis,
e como criar novos exemplos para o ink-kanban-board.

## Boundaries

**Fazer:**

- Consultar esta skill ao criar novos exemplos ou modificar scripts npm
- Seguir o padrão dos exemplos existentes (shebang, JSDoc, import pattern)
- Testar exemplos em pelo menos 2 tamanhos de terminal (80x24 e 150x50)
- Adicionar um script npm para cada novo exemplo

**Não fazer:**

- Importar de caminhos internos do `src/` em exemplos de consumer (usar package)
- Criar exemplos que dependem de serviços externos (devem ser self-contained)
- Usar CommonJS em exemplos (o projeto é ESM-only)
- Criar exemplos que não adicionam valor demonstrativo novo

## Scripts npm

| Script | Comando | Propósito |
|--------|---------|-----------|
| `build` | `tsc` | Compila TypeScript → `dist/` |
| `typecheck` | `tsc --noEmit` | Verifica tipos sem emitir |
| `dev` | `tsx examples/demo.tsx` | Demo interativa principal |
| `demo:sim` | `tsx examples/demo.tsx` | Alias de `dev` |
| `demo:hetero` | `tsx examples/heterogeneous-cards.tsx` | Cards com alturas variáveis |
| `demo:minimal` | `tsx examples/minimal.tsx` | Board estático mínimo |
| `demo:focus` | `tsx examples/focus-navigation.tsx` | Navegação com teclado + overflow |
| `demo:pipeline` | `tsx examples/multi-pipeline.tsx` | Pipeline CI/CD com 5 colunas |
| `demo:logs` | `tsx examples/live-logs.tsx` | contentLines streaming |
| `demo:modal` | `tsx examples/card-detail-modal.tsx` | Modal interativo com seções |

## Catálogo de Exemplos

### minimal.tsx — Quick Start
- Board estático, 3 colunas, sem state, sem timers
- Demonstra: API básica, estrutura mínima de dados
- Audience: primeiro contato com o componente

### demo.tsx — Simulação Interativa
- Tasks movem entre colunas automaticamente (timer 1.2s)
- Navegação 2D: ↑↓/jk dentro da coluna, ←→/hl entre colunas
- Reset automático quando todos terminam
- Demonstra: useTerminalSize, focusedCardKey, useInput, progress, contentLines

### heterogeneous-cards.tsx — Cards de Alturas Variáveis
- Força `density="spacious"` e `breakpoint="wide"`
- Cards com 0 a 5 contentLines, com/sem metadata, progress, contextLine
- Demonstra: variação visual, card com erro, cards mínimos vs ricos

### focus-navigation.tsx — Overflow + Foco
- 8 cards no backlog, maxItemsPerColumn=4 → overflow indicators (↑↓)
- Navegação 2D completa com ESC para unfocus
- Demonstra: sliceAroundFocus, overflow indicators

### multi-pipeline.tsx — Pipeline 5 Colunas
- QUEUE → BUILD → TEST → DEPLOY → LIVE
- 8 serviços movendo automaticamente (timer 2s)
- Demonstra: board com N colunas (não apenas 3), custom Tone por estágio

### live-logs.tsx — Streaming de Logs
- 3 workers com contentLines atualizadas a cada 1.5s
- Mantém últimas 4 linhas (efeito tail -f)
- Demonstra: contentLines dinâmico, coluna única

### pi-orq-adapter.ts — Referência de Adapter
- NÃO é um executável, é um módulo de referência
- Mapeia AgentStatus → KanbanCardData com tipagem exaustiva
- Demonstra: padrão adapter completo para integração real

### card-detail-modal.tsx — Modal Interativo
- Usa `onCardPress` no KanbanBoard para abrir modal com Enter sobre card focado, fecha com Esc
- Indicador `⏎` aparece automaticamente no card focado (gerenciado pelo board)
- 4 tipos de seção: text (com input), checklist (toggle), select (radio), steps (pipeline)
- Navegação: ↑↓ entre seções/items, Tab/Shift+Tab jump, ←→ steps, Space toggle
- Demonstra: CardDetailModal, useCardModal, onCardPress, ModalSection[]

## Workflow para Criar um Novo Exemplo

1. Criar `examples/<nome-descritivo>.tsx` com shebang `#!/usr/bin/env tsx`
2. Adicionar JSDoc no topo: título, `Run with:`, propósito
3. Importar de `../src/index.js` (path relativo, extensão `.js`)
4. Adicionar script em `package.json`: `"demo:<nome>": "tsx examples/<nome>.tsx"`
5. Criar componente `App` com render isolado: `render(<App />)`
6. Incluir `useInput` com `q` para sair: `if (input === "q") process.exit(0)`
7. Testar em terminal pequeno (80x24) e grande (150x50)

## Gotchas

- Exemplos usam `tsx` (dev dep) para execução direta sem build
- Exemplos importam de `../src/index.js` (não do package publicado)
- O `examples/` directory está em `tsconfig.json > exclude` — não é compilado
- `demo.tsx` e `demo:sim` são o mesmo exemplo (alias no package.json)
- Exemplos com `useInput` devem sempre ter `q` para quit e `Escape` para unfocus
