# Skills opencode spec compliance

> **Pra quem**: agentes AI deste repo (Claude Code, opencode, Codex,
> Cursor, Copilot). Carregue sob demanda — não é necessário em toda
> sessão.

## TL;DR

opencode core honra apenas 5 campos do frontmatter `SKILL.md`
(`name`, `description`, `license`, `compatibility`, `metadata`).
Os campos `paths` e `disable-model-invocation` da spec Anthropic
AAIF são parseados sem erro e **silenciosamente ignorados** — emiti-los
gera falsa expectativa. Este projeto teve as skills purificadas em
2026-04-26 para remover esses no-ops.

## Fields honrados por harness

| Campo | opencode core | Claude Code |
|---|---|---|
| `name` (kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$`) | ✅ | ✅ |
| `description` (≤1024 chars; truncado em ~250 no listing) | ✅ | ✅ |
| `license`, `compatibility`, `metadata` | ✅ | ✅ |
| `allowed-tools` (lowercase: bash/read/edit/grep/...) | ⚠️ parseado, enforcement só pelo agent via opencode.json | ✅ enforced |
| `paths` (autoload por glob) | ❌ no-op silencioso | ✅ |
| `disable-model-invocation` | ❌ no-op (issue #11972) | ✅ |

## Mudanças aplicadas neste projeto (2026-04-26)

- 4 SKILL.md tiveram `paths:` removido (`adapter-integration`,
  `component-api`, `examples-development`, `responsive-layout`)
- `CLAUDE.md` (wrapper de 2 linhas apontando para AGENTS.md) foi
  substituído por **symlink** para `AGENTS.md` — fonte única, evita
  drift

## Indo em frente

Ao criar ou editar SKILL.md neste repo:

- Não emita `paths:` no frontmatter (autoload por glob não funciona
  em opencode core)
- Não emita `disable-model-invocation:` (no-op em opencode); para
  gating de operações destrutivas, use slash command em
  `.opencode/commands/` + confirmação humana literal no Workflow +
  lógica isolada em `scripts/`
- Use **lowercase** em `allowed-tools`: `bash, read, edit, write,
  grep, glob, webfetch, websearch, skill, todowrite`. PascalCase
  (`Read, Bash`) ou Pi-style (`read_file`) são silenciosamente
  ignorados
- Use **kebab-case puro** em `name` (regex
  `^[a-z0-9]+(-[a-z0-9]+)*$` rejeita underscores)
- Mantenha `CLAUDE.md` como **symlink** de `AGENTS.md`
  (`ln -sf AGENTS.md CLAUDE.md`) — AGENTS.md é canônico (Linux
  Foundation/AAIF, 2026); duplicar arquivos divergem
- Faça `description` **pushy**: trigger words concretas + frase
  *"mesmo que o usuário não diga 'skill'"* / *"even if not asked"*

## Triggering em opencode (importante)

opencode roteia skills **puramente via LLM lendo a description no
system prompt** — não há autoload por path glob, não há slash
autocomplete para skills (só commands em `.opencode/commands/`
aparecem em `/<prefix>`), não há Tool Search nativo. A description
é o ÚNICO mecanismo de ativação automática. Se uma skill não está
sendo invocada quando deveria, o problema está na description, não
no `paths`.

## Sources

- [Agent Skills | OpenCode (oficial)](https://opencode.ai/docs/skills/)
- [Tools | OpenCode (oficial)](https://opencode.ai/docs/tools/)
- [Commands | OpenCode (oficial)](https://opencode.ai/docs/commands/)
- [Skills System | sst/opencode | DeepWiki](https://deepwiki.com/sst/opencode/5.7-skills-system)
- [Issue #11972 — disable-model-invocation no-op](https://github.com/anomalyco/opencode/issues/11972)
- [Issue #7846 — /skills autocomplete missing](https://github.com/anomalyco/opencode/issues/7846)
- [AAIF (Linux Foundation) — agents.md spec](https://agents.md/)
