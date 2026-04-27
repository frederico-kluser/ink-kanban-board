# Agent Skills — ink-kanban-board

> Catálogo das skills disponíveis neste repo. Leia para decidir
> qual skill invocar. Gerado por huu_audit-and-improve-skills v4.3.0.

Total: **4 skills**.

## Quick reference

| Skill | Path | O que faz | Triggers |
|---|---|---|---|
| `adapter-integration` | `.agents/skills/adapter-integration/` | Padrão adapter para mapear dados de domínio externo aos tipos genéricos KanbanCard/Kanb... | integrar o board em outro projeto |
| `component-api` | `.agents/skills/component-api/` | Define os type contracts e composição dos componentes KanbanBoard, KanbanCard, CardDeta... | criar/modificar componentes, tipos |
| `examples-development` | `.agents/skills/examples-development/` | Workflow de desenvolvimento, scripts npm e criação de exemplos demo para ink-kanban-board. | criar demos, modificar o dev workflow |
| `responsive-layout` | `.agents/skills/responsive-layout/` | Sistema de breakpoints e density do terminal com thresholds específicos (150/110 cols, ... | ajustar layout responsivo, viewport |

## Full descriptions

### `adapter-integration`

- **Path**: `.agents/skills/adapter-integration/SKILL.md`
- **Tools**: default
- **Description** (verbatim do frontmatter):
  > Padrão adapter para mapear dados de domínio externo aos tipos genéricos KanbanCard/KanbanColumn. Use ao integrar o board em outro projeto. Não use para modificar componentes internos.
- **Quando invocar**: integrar o board em outro projeto

### `component-api`

- **Path**: `.agents/skills/component-api/SKILL.md`
- **Tools**: default
- **Description** (verbatim do frontmatter):
  > Define os type contracts e composição dos componentes KanbanBoard, KanbanCard, CardDetailModal, Panel, Pill, StatCard. Use ao criar/modificar componentes ou tipos. Não use para layout responsivo ou exemplos.
- **Quando invocar**: criar/modificar componentes, tipos

### `examples-development`

- **Path**: `.agents/skills/examples-development/SKILL.md`
- **Tools**: default
- **Description** (verbatim do frontmatter):
  > Workflow de desenvolvimento, scripts npm e criação de exemplos demo para ink-kanban-board. Use ao criar demos ou modificar o dev workflow. Não use para API de componentes ou layout responsivo.
- **Quando invocar**: criar demos, modificar o dev workflow

### `responsive-layout`

- **Path**: `.agents/skills/responsive-layout/SKILL.md`
- **Tools**: default
- **Description** (verbatim do frontmatter):
  > Sistema de breakpoints e density do terminal com thresholds específicos (150/110 cols, 45 rows). Use ao ajustar layout responsivo ou viewport. Não use para API de componentes ou tipos.
- **Quando invocar**: ajustar layout responsivo, viewport

