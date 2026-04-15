#!/usr/bin/env tsx
/**
 * ink-kanban-board — Card Detail Modal Demo
 *
 * Run with: npm run demo:modal
 *
 * Press Enter on a focused card to open a detail modal with:
 * - Notes (multi-line text with input)
 * - Subtasks (interactive checklist)
 * - Priority (single-select)
 * - Pipeline (step progress with actions)
 *
 * The board remains visible behind the modal overlay.
 */
import React, { useState } from "react";
import { render, Box, Text, useInput } from "ink";
import {
  KanbanBoard,
  CardDetailModal,
  useTerminalSize,
  useCardModal,
  type KanbanCardData,
  type KanbanColumn,
  type ModalSection,
  type ChecklistItem,
  type StepItem,
} from "../src/index.js";

// ── Domain data ────────────────────────────────────────────

interface TaskData {
  id: string;
  name: string;
  column: "todo" | "doing" | "done";
  notes: string;
  subtasks: ChecklistItem[];
  priority: string;
  pipeline: StepItem[];
}

function createTasks(): TaskData[] {
  return [
    {
      id: "task-1",
      name: "Refactor auth module",
      column: "todo",
      notes: "Migrate from JWT to OAuth2.\nCheck compatibility with existing endpoints.",
      subtasks: [
        { key: "s1", label: "Audit current auth flow", checked: true },
        { key: "s2", label: "Design new OAuth2 flow", checked: false },
        { key: "s3", label: "Implement token refresh", checked: false },
        { key: "s4", label: "Update API documentation", checked: false },
      ],
      priority: "high",
      pipeline: [
        { key: "plan", label: "Plan", status: "done" },
        { key: "impl", label: "Implement", status: "pending" },
        { key: "test", label: "Test", status: "pending" },
        { key: "deploy", label: "Deploy", status: "pending" },
      ],
    },
    {
      id: "task-2",
      name: "Fix login page CSS",
      column: "todo",
      notes: "Button alignment is off on mobile.\nAlso check dark mode contrast.",
      subtasks: [
        { key: "s1", label: "Identify broken selectors", checked: false },
        { key: "s2", label: "Fix responsive layout", checked: false },
      ],
      priority: "medium",
      pipeline: [
        { key: "plan", label: "Plan", status: "done" },
        { key: "impl", label: "Implement", status: "active" },
        { key: "test", label: "Test", status: "pending" },
        { key: "deploy", label: "Deploy", status: "pending" },
      ],
    },
    {
      id: "task-3",
      name: "Add unit tests for API",
      column: "doing",
      notes: "Coverage target: 80%.\nFocus on edge cases in /users and /billing.",
      subtasks: [
        { key: "s1", label: "Setup test framework", checked: true },
        { key: "s2", label: "Write user endpoint tests", checked: true },
        { key: "s3", label: "Write billing endpoint tests", checked: false },
        { key: "s4", label: "Add CI integration", checked: false },
      ],
      priority: "high",
      pipeline: [
        { key: "plan", label: "Plan", status: "done" },
        { key: "impl", label: "Implement", status: "active" },
        { key: "test", label: "Test", status: "pending" },
        { key: "deploy", label: "Deploy", status: "pending" },
      ],
    },
    {
      id: "task-4",
      name: "Update README docs",
      column: "doing",
      notes: "Add card detail modal documentation.\nUpdate API reference table.",
      subtasks: [
        { key: "s1", label: "Write modal section docs", checked: true },
        { key: "s2", label: "Add code examples", checked: false },
      ],
      priority: "low",
      pipeline: [
        { key: "plan", label: "Plan", status: "done" },
        { key: "impl", label: "Implement", status: "done" },
        { key: "test", label: "Test", status: "active" },
        { key: "deploy", label: "Deploy", status: "pending" },
      ],
    },
    {
      id: "task-5",
      name: "Migrate database schema",
      column: "done",
      notes: "Migration completed successfully.\nAll indexes verified.",
      subtasks: [
        { key: "s1", label: "Write migration script", checked: true },
        { key: "s2", label: "Test on staging", checked: true },
        { key: "s3", label: "Run on production", checked: true },
      ],
      priority: "critical",
      pipeline: [
        { key: "plan", label: "Plan", status: "done" },
        { key: "impl", label: "Implement", status: "done" },
        { key: "test", label: "Test", status: "done" },
        { key: "deploy", label: "Deploy", status: "done" },
      ],
    },
    {
      id: "task-6",
      name: "Optimize image loading",
      column: "done",
      notes: "Lazy loading + WebP conversion done.",
      subtasks: [
        { key: "s1", label: "Add lazy loading", checked: true },
        { key: "s2", label: "Convert to WebP", checked: true },
      ],
      priority: "medium",
      pipeline: [
        { key: "plan", label: "Plan", status: "done" },
        { key: "impl", label: "Implement", status: "done" },
        { key: "test", label: "Test", status: "done" },
        { key: "deploy", label: "Deploy", status: "done" },
      ],
    },
  ];
}

// ── App ────────────────────────────────────────────────────

function ModalDemoApp() {
  const { breakpoint, density } = useTerminalSize();
  const [tasks, setTasks] = useState<TaskData[]>(createTasks);
  const [focusedKey, setFocusedKey] = useState<string | null>("task-1");
  const { isOpen, card, open, close } = useCardModal();

  // Build board columns
  const toCard = (task: TaskData): KanbanCardData => ({
    key: task.id,
    title: task.id.replace("task-", "TASK "),
    subtitle: task.name,
    status: {
      label: task.column === "done" ? "Done" : task.column === "doing" ? "Running" : "Pending",
      color: task.column === "done" ? "green" : task.column === "doing" ? "cyan" : "gray",
      spinning: task.column === "doing",
    },
    startedAt: Date.now() - 300_000,
    finishedAt: task.column === "done" ? Date.now() : undefined,
  });

  const columns: KanbanColumn[] = [
    {
      key: "todo",
      title: "TODO",
      tone: "warning",
      cards: tasks.filter((t) => t.column === "todo").map(toCard),
    },
    {
      key: "doing",
      title: "DOING",
      tone: "accent",
      cards: tasks.filter((t) => t.column === "doing").map(toCard),
    },
    {
      key: "done",
      title: "DONE",
      tone: "success",
      cards: tasks.filter((t) => t.column === "done").map(toCard),
    },
  ];

  // Keyboard navigation (disabled while modal is open)
  useInput(
    (input, key) => {
      const colNames = ["todo", "doing", "done"] as const;
      const colTasks = colNames.map((c) => tasks.filter((t) => t.column === c));

      let col = -1;
      let row = -1;
      if (focusedKey) {
        for (let c = 0; c < colTasks.length; c++) {
          const r = colTasks[c]!.findIndex((t) => t.id === focusedKey);
          if (r !== -1) {
            col = c;
            row = r;
            break;
          }
        }
      }

      if (key.downArrow || input === "j") {
        if (col === -1) {
          const first = colTasks.find((c) => c.length > 0);
          if (first) setFocusedKey(first[0]!.id);
        } else {
          const next = Math.min(colTasks[col]!.length - 1, row + 1);
          setFocusedKey(colTasks[col]![next]!.id);
        }
      } else if (key.upArrow || input === "k") {
        if (col === -1) return;
        const next = Math.max(0, row - 1);
        setFocusedKey(colTasks[col]![next]!.id);
      } else if (key.rightArrow || input === "l") {
        const nextCol = col === -1 ? 0 : Math.min(colTasks.length - 1, col + 1);
        const target = colTasks[nextCol]!;
        if (target.length > 0) {
          setFocusedKey(target[Math.min(row < 0 ? 0 : row, target.length - 1)]!.id);
        }
      } else if (key.leftArrow || input === "h") {
        const nextCol = col === -1 ? 0 : Math.max(0, col - 1);
        const target = colTasks[nextCol]!;
        if (target.length > 0) {
          setFocusedKey(target[Math.min(row < 0 ? 0 : row, target.length - 1)]!.id);
        }
      } else if (key.return && focusedKey) {
        const task = tasks.find((t) => t.id === focusedKey);
        if (task) open(toCard(task));
      } else if (key.escape) {
        setFocusedKey(null);
      } else if (input === "q") {
        process.exit(0);
      }
    },
    { isActive: !isOpen },
  );

  // Build modal sections from the focused task's domain data
  const focusedTask = focusedKey ? tasks.find((t) => t.id === focusedKey) : null;

  const sections: ModalSection[] = focusedTask
    ? [
        {
          type: "text" as const,
          label: "📝 Notes",
          value: focusedTask.notes,
          placeholder: "Type a note and press Enter...",
          onSubmit: (text: string) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === focusedTask.id
                  ? { ...t, notes: t.notes ? `${t.notes}\n${text}` : text }
                  : t,
              ),
            );
          },
        },
        {
          type: "checklist" as const,
          label: "☑ Subtasks",
          items: focusedTask.subtasks,
          onToggle: (key: string, checked: boolean) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === focusedTask.id
                  ? {
                      ...t,
                      subtasks: t.subtasks.map((s) =>
                        s.key === key ? { ...s, checked } : s,
                      ),
                    }
                  : t,
              ),
            );
          },
        },
        {
          type: "select" as const,
          label: "⚡ Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Critical", value: "critical" },
          ],
          value: focusedTask.priority,
          onChange: (value: string) => {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === focusedTask.id ? { ...t, priority: value } : t,
              ),
            );
          },
        },
        {
          type: "steps" as const,
          label: "🔄 Pipeline",
          steps: focusedTask.pipeline,
          onAction: (key: string) => {
            setTasks((prev) =>
              prev.map((t) => {
                if (t.id !== focusedTask.id) return t;
                const steps = t.pipeline.map((s) => {
                  if (s.key === key && s.status === "pending") {
                    return { ...s, status: "active" as const };
                  }
                  if (s.key === key && s.status === "active") {
                    return { ...s, status: "done" as const };
                  }
                  return s;
                });
                return { ...t, pipeline: steps };
              }),
            );
          },
        },
      ]
    : [];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">
          ink-kanban-board — Card Detail Modal
        </Text>
        <Text color="gray">
          {isOpen
            ? "Tab: sections • ↑↓: items • Space/Enter: interact • Esc: close"
            : "↑↓←→/hjkl: navigate • Enter: open modal • q: quit"}
        </Text>
      </Box>
      {isOpen && card ? (
        <CardDetailModal
          card={card}
          sections={sections}
          onClose={close}
        />
      ) : (
        <KanbanBoard
          columns={columns}
          focusedCardKey={focusedKey}
          breakpoint={breakpoint}
          density={density}
          maxItemsPerColumn={5}
        />
      )}
    </Box>
  );
}

// ── Entry point ────────────────────────────────────────────

render(<ModalDemoApp />);
