#!/usr/bin/env tsx
/**
 * ink-kanban-board — Interactive Demo
 *
 * Run with: npm run dev
 *
 * Renders a Kanban board with simulated tasks that move
 * through columns over time.
 */
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput } from "ink";
import {
  KanbanBoard,
  useTerminalSize,
  type KanbanCardData,
  type KanbanColumn,
} from "../src/index.js";

// ── Mock data ──────────────────────────────────────────────

const TASK_NAMES = [
  "Refactor auth module",
  "Fix login page CSS",
  "Add unit tests for API",
  "Update README docs",
  "Migrate database schema",
  "Optimize image loading",
  "Add dark mode support",
  "Setup CI/CD pipeline",
  "Fix memory leak in parser",
  "Add rate limiting",
];

interface SimulatedTask {
  id: string;
  name: string;
  column: "todo" | "doing" | "done";
  progress: number;
  statusLabel: string;
  statusColor: string;
  spinning: boolean;
  logs: string[];
  startedAt: number;
  finishedAt?: number;
}

function createInitialTasks(): SimulatedTask[] {
  return TASK_NAMES.map((name, i) => ({
    id: `task-${i + 1}`,
    name,
    column: "todo" as const,
    progress: 0,
    statusLabel: "Pending",
    statusColor: "gray",
    spinning: false,
    logs: [],
    startedAt: Date.now(),
  }));
}

// ── Demo App ───────────────────────────────────────────────

function DemoApp() {
  const { breakpoint, density } = useTerminalSize();
  const [tasks, setTasks] = useState<SimulatedTask[]>(createInitialTasks);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Simulate tasks moving through columns
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setTasks((prev) => {
        const next = [...prev];

        // Move a random TODO to DOING
        const todoTasks = next.filter((t) => t.column === "todo");
        const doingTasks = next.filter((t) => t.column === "doing");

        if (todoTasks.length > 0 && doingTasks.length < 3) {
          const task = todoTasks[Math.floor(Math.random() * todoTasks.length)]!;
          task.column = "doing";
          task.statusLabel = "Working";
          task.statusColor = "cyan";
          task.spinning = true;
          task.progress = 0.2;
          task.logs = [`Started at ${new Date().toLocaleTimeString()}`];
        }

        // Progress DOING tasks
        for (const task of next.filter((t) => t.column === "doing")) {
          task.progress = Math.min(1, task.progress + 0.15 + Math.random() * 0.1);

          if (task.progress >= 1) {
            task.column = "done";
            task.statusLabel = "Done";
            task.statusColor = "green";
            task.spinning = false;
            task.finishedAt = Date.now();
            task.logs.push(`Completed at ${new Date().toLocaleTimeString()}`);
          } else if (task.progress > 0.7) {
            task.statusLabel = "Finalizing";
            task.statusColor = "magenta";
            task.logs.push(`Finalizing... ${Math.round(task.progress * 100)}%`);
          } else if (task.progress > 0.4) {
            task.statusLabel = "Running";
            task.statusColor = "blueBright";
            task.logs.push(`Processing... ${Math.round(task.progress * 100)}%`);
          }
        }

        // Reset if all done
        if (next.every((t) => t.column === "done")) {
          return createInitialTasks();
        }

        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation for focus (↑↓ within column, ←→ across columns)
  useInput((input, key) => {
    // Group tasks by column to enable 2D navigation
    const colNames = ["todo", "doing", "done"] as const;
    const colTasks = colNames.map((c) => tasks.filter((t) => t.column === c));

    // Find current position as (col, row)
    let col = -1, row = -1;
    if (focusedKey) {
      for (let c = 0; c < colTasks.length; c++) {
        const r = colTasks[c]!.findIndex((t) => t.id === focusedKey);
        if (r !== -1) { col = c; row = r; break; }
      }
    }

    if (key.downArrow || input === "j") {
      if (col === -1) { // nothing focused — pick first card of first non-empty column
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
    } else if (key.escape) {
      setFocusedKey(null);
    } else if (input === "q") {
      process.exit(0);
    }
  });

  // Build columns from simulated tasks
  const toCard = (task: SimulatedTask): KanbanCardData => ({
    key: task.id,
    title: task.column === "doing"
      ? `${task.id.replace("task-", "TASK ")} [${Math.round(task.progress * 100)}%]`
      : task.id.replace("task-", "TASK "),
    subtitle: task.name,
    status: {
      label: task.statusLabel,
      color: task.statusColor,
      spinning: task.spinning,
    },
    progress: task.column === "doing" ? task.progress : undefined,
    metadata: task.column === "done"
      ? [{ label: "Completed" }]
      : undefined,
    contentLines: task.logs.length > 0 ? task.logs.slice(-3) : undefined,
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
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

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">ink-kanban-board — Demo</Text>
        <Text color="gray">↑↓/jk ←→/hl: navigate • esc: unfocus • q: quit • tick: {tick}</Text>
      </Box>
      <KanbanBoard
        columns={columns}
        focusedCardKey={focusedKey}
        breakpoint={breakpoint}
        density={density}
        maxItemsPerColumn={6}
      />
    </Box>
  );
}

// ── Entry point ────────────────────────────────────────────

render(<DemoApp />);
