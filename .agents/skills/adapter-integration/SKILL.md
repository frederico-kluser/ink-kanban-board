---
name: adapter-integration
description: >-
  Padrão adapter para mapear dados de domínio externo aos tipos genéricos
  KanbanCard/KanbanColumn. Use ao integrar o board em outro projeto.
  Não use para modificar componentes internos.
metadata:
  version: "1.0.0"
  last-reviewed: "2026-04-15"
paths: "examples/pi-orq-adapter.ts"
---

# Adapter Integration

## Goal

Documentar o padrão de integração para consumir ink-kanban-board em projetos
externos. O board usa tipos genéricos intencionalmente — consumidores criam
funções adapter que mapeiam seus domain types para KanbanColumn[].

## Boundaries

**Fazer:**

- Criar uma função adapter que converte domain data → KanbanColumn[]
- Mapear status/phases do domínio para CardStatus (label + color + spinning)
- Definir lógica de roteamento (qual card vai em qual coluna) no adapter
- Usar o arquivo `examples/pi-orq-adapter.ts` como referência concreta

**Não fazer:**

- Adicionar tipos domain-specific em `src/types.ts`
- Importar diretamente de `src/` — usar sempre o package entrypoint
- Assumir que o board sempre terá 3 colunas (suporta qualquer quantidade)
- Passar dados raw sem adapter (os tipos são intencionalmente genéricos)

## Workflow de Integração

### Passo 1: Instalar

```bash
npm install ink-kanban-board
# ink e react devem já estar instalados (peer deps)
```

### Passo 2: Criar Adapter

Criar uma função pura que mapeia seus dados para `KanbanColumn[]`:

```typescript
import type { KanbanCardData, KanbanColumn, CardStatus } from "ink-kanban-board";

// Mapear cada status do domínio para CardStatus
const STATUS_MAP: Record<YourStatus, CardStatus> = {
  pending:  { label: "Pending",  color: "gray" },
  active:   { label: "Active",   color: "cyan",  spinning: true },
  done:     { label: "Done",     color: "green" },
  error:    { label: "Error",    color: "red" },
};

// Converter domain item → KanbanCardData
function toCard(item: YourItem): KanbanCardData {
  return {
    key: item.id,
    title: item.name.toUpperCase(),
    subtitle: item.description,
    status: STATUS_MAP[item.status],
    progress: item.status === "active" ? item.progress : undefined,
    metadata: item.tags?.map(t => ({ label: t })),
    startedAt: item.createdAt,
    finishedAt: item.completedAt,
  };
}

// Agrupar em colunas
export function toKanbanColumns(items: YourItem[]): KanbanColumn[] {
  return [
    { key: "todo", title: "TODO", tone: "warning",
      cards: items.filter(i => i.status === "pending").map(toCard) },
    { key: "doing", title: "DOING", tone: "accent",
      cards: items.filter(i => i.status === "active").map(toCard) },
    { key: "done", title: "DONE", tone: "success",
      cards: items.filter(i => ["done", "error"].includes(i.status)).map(toCard) },
  ];
}
```

### Passo 3: Renderizar

```tsx
import { KanbanBoard, useTerminalSize } from "ink-kanban-board";

function Dashboard({ items }: { items: YourItem[] }) {
  const { breakpoint, density } = useTerminalSize();
  const columns = toKanbanColumns(items);

  return (
    <KanbanBoard
      columns={columns}
      breakpoint={breakpoint}
      density={density}
    />
  );
}
```

## Referência: pi-orq Adapter

O arquivo `examples/pi-orq-adapter.ts` demonstra um adapter completo:

- Mapeia `AgentLifecyclePhase` (16 fases) → `CardStatus` com labels/cores/spinners
- Define `PHASE_PROGRESS` com valores 0-1 por fase para barra de progresso
- Usa Sets (`TODO_PHASES`, `DOING_PHASES`) para roteamento de colunas
- Extrai metadata (cost, tokens, branch) dos campos do AgentStatus
- Usa `contextLine` para mostrar o último log ou erro

**Padrões chave do pi-orq adapter:**

- Função pura `agentsToKanbanColumns(agents)` → sem side effects
- Mapeamento exaustivo de todas as phases (type-safe via Record)
- `contextIsError: !!agent.error` → coloração automática em vermelho
- Tokens formatados como `"12k tok"` para manter cards compactas

## Gotchas

- O `key` do card DEVE ser único globalmente (não apenas dentro da coluna)
- `progress` aceita 0-1 (não 0-100) — a renderização multiplica por 100
- `tone` da coluna afeta a cor da borda e header, não dos cards
- Cards com `spinning: true` no status renderizam `<Spinner>` apenas em spacious
- `contentLines` com arrays de tamanhos diferentes resultam em cards com
  alturas diferentes — isso é intencional (cards heterogêneos)
- O board calcula "done" para o ProgressSummary usando a ÚLTIMA coluna,
  e "doing" usando as colunas do meio — adapte a ordem se necessário
