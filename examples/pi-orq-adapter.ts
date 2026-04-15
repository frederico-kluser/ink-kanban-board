/**
 * ink-kanban-board — pi-orq Adapter Example
 *
 * This file demonstrates how to map pi-orq's domain types
 * (AgentStatus, AgentLifecyclePhase, BoardViewModel) to
 * ink-kanban-board's generic KanbanColumn[] interface.
 *
 * This is NOT a runtime dependency — it's a reference for
 * pi-orq maintainers integrating the kanban board package.
 */

import type { KanbanCardData, KanbanColumn, CardStatus } from "../src/index.js";

// ── pi-orq types (simplified for reference) ────────────────

type AgentLifecyclePhase =
  | "pending" | "worktree_creating" | "worktree_ready" | "session_starting"
  | "streaming" | "tool_running" | "awaiting_decision" | "retried"
  | "finalizing" | "validating" | "committing" | "pushing" | "cleaning_up"
  | "done" | "no_changes" | "error";

interface AgentStatus {
  agentId: number;
  phase: AgentLifecyclePhase;
  currentFile: string | null;
  filesModified: string[];
  logs: string[];
  tokensIn: number;
  tokensOut: number;
  cost: number;
  branchName?: string;
  pushStatus: string;
  commitSha?: string;
  effectiveModelId?: string;
  error?: string;
  stageIndex?: number;
  stageName?: string;
}

// ── Phase → CardStatus mapping ─────────────────────────────

const PHASE_STATUS: Record<AgentLifecyclePhase, CardStatus> = {
  pending:            { label: "Waiting",          color: "gray" },
  worktree_creating:  { label: "Creating worktree", color: "yellow", spinning: true },
  worktree_ready:     { label: "Worktree ready",   color: "yellow" },
  session_starting:   { label: "Starting session", color: "yellow", spinning: true },
  streaming:          { label: "Streaming",        color: "cyan",   spinning: true },
  tool_running:       { label: "Tool running",     color: "blueBright", spinning: true },
  awaiting_decision:  { label: "Awaiting decision", color: "yellowBright" },
  retried:            { label: "Retried",          color: "gray" },
  finalizing:         { label: "Finalizing",       color: "magenta", spinning: true },
  validating:         { label: "Validating",       color: "magenta", spinning: true },
  committing:         { label: "Committing",       color: "magenta", spinning: true },
  pushing:            { label: "Pushing",          color: "magenta", spinning: true },
  cleaning_up:        { label: "Cleaning up",      color: "magenta", spinning: true },
  done:               { label: "Done",             color: "green" },
  no_changes:         { label: "No changes",       color: "gray" },
  error:              { label: "Error",            color: "red" },
};

const PHASE_PROGRESS: Record<AgentLifecyclePhase, number> = {
  pending: 0.04, worktree_creating: 0.12, worktree_ready: 0.2,
  session_starting: 0.28, streaming: 0.52, tool_running: 0.66,
  awaiting_decision: 1, retried: 1, finalizing: 0.78, validating: 0.84,
  committing: 0.9, pushing: 0.96, cleaning_up: 0.98, done: 1, no_changes: 1, error: 1,
};

const TODO_PHASES = new Set<AgentLifecyclePhase>(["pending", "worktree_creating", "worktree_ready", "session_starting"]);
const DOING_PHASES = new Set<AgentLifecyclePhase>(["streaming", "tool_running"]);

// ── Adapter function ───────────────────────────────────────

/**
 * Converts an array of pi-orq AgentStatus objects into
 * ink-kanban-board KanbanColumn[].
 *
 * Usage in your pi-orq dashboard component:
 * ```tsx
 * const columns = agentsToKanbanColumns(state.agents);
 * <KanbanBoard columns={columns} density={density} />
 * ```
 */
export function agentsToKanbanColumns(agents: AgentStatus[]): KanbanColumn[] {
  const todo: KanbanCardData[] = [];
  const doing: KanbanCardData[] = [];
  const done: KanbanCardData[] = [];

  for (const agent of agents) {
    const card = agentToCard(agent);

    if (TODO_PHASES.has(agent.phase)) {
      todo.push(card);
    } else if (DOING_PHASES.has(agent.phase)) {
      doing.push(card);
    } else {
      done.push(card);
    }
  }

  return [
    { key: "todo", title: "TODO", tone: "warning", cards: todo },
    { key: "doing", title: "DOING", tone: "accent", cards: doing },
    { key: "done", title: "DONE", tone: "success", cards: done },
  ];
}

function agentToCard(agent: AgentStatus): KanbanCardData {
  const metaParts: string[] = [];
  if (agent.cost > 0) metaParts.push(`$${agent.cost.toFixed(4)}`);
  const totalTokens = agent.tokensIn + agent.tokensOut;
  if (totalTokens > 0) metaParts.push(`${Math.round(totalTokens / 1000)}k tok`);
  if (agent.branchName) metaParts.push(agent.branchName.slice(0, 18));

  return {
    key: `agent-${agent.agentId}`,
    title: `AGENT ${String(agent.agentId).padStart(2, "0")}`,
    subtitle: agent.currentFile || agent.filesModified[0] || undefined,
    status: PHASE_STATUS[agent.phase],
    progress: PHASE_PROGRESS[agent.phase],
    metadata: metaParts.length > 0
      ? metaParts.map((label) => ({ label }))
      : undefined,
    contextLine: agent.error || (agent.logs.length > 0 ? agent.logs[agent.logs.length - 1] : undefined),
    contextIsError: !!agent.error,
  };
}
