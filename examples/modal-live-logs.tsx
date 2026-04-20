#!/usr/bin/env tsx
/**
 * ink-kanban-board — Modal Live Logs Demo
 *
 * Run with: npm run demo:modal-logs
 *
 * Demonstrates the CardDetailModal `type: "logs"` section:
 * - real-time log updates while modal is open
 * - running/stopped task status inside the section
 * - arrow navigation through log lines
 * - conditional auto-follow (only when cursor is at the tail)
 */
import React, { useEffect, useState } from "react";
import { render, Box, Text, useInput } from "ink";
import {
  KanbanBoard,
  CardDetailModal,
  useCardModal,
  useTerminalSize,
  type KanbanCardData,
  type KanbanColumn,
  type ModalSection,
} from "../src/index.js";

const LOG_MESSAGES = [
  "Bootstrapping task runtime",
  "Pulling cached dependencies",
  "Compiling TypeScript project",
  "Running lint checks",
  "Executing unit tests",
  "Publishing build artifacts",
  "Applying migration step",
  "Verifying healthcheck endpoint",
  "Syncing task metadata",
  "Finalizing execution context",
];

const COMPLETE_AFTER_LINES = 24;

interface TaskState {
  id: string;
  name: string;
  column: "running" | "done";
  logs: string[];
  msgIndex: number;
  startedAt: number;
  finishedAt?: number;
}

function createTasks(): TaskState[] {
  return [
    {
      id: "task-build",
      name: "Build Pipeline",
      column: "running",
      logs: [],
      msgIndex: 0,
      startedAt: Date.now(),
    },
    {
      id: "task-release",
      name: "Release Worker",
      column: "running",
      logs: [],
      msgIndex: 3,
      startedAt: Date.now(),
    },
  ];
}

function toCard(task: TaskState): KanbanCardData {
  return {
    key: task.id,
    title: task.id.toUpperCase(),
    subtitle: task.name,
    status: {
      label: task.column === "running" ? "Running" : "Done",
      color: task.column === "running" ? "cyan" : "green",
      spinning: task.column === "running",
    },
    startedAt: task.startedAt,
    finishedAt: task.finishedAt,
  };
}

function ModalLiveLogsApp() {
  const { breakpoint, density } = useTerminalSize();
  const [tasks, setTasks] = useState<TaskState[]>(createTasks);
  const [focusedKey, setFocusedKey] = useState<string | null>("task-build");
  const { isOpen, card, open, close } = useCardModal();

  useEffect(() => {
    const timer = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.column !== "running") return task;

          const nextMsgIndex = (task.msgIndex + 1) % LOG_MESSAGES.length;
          const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
          const line = `[${timestamp}] ${LOG_MESSAGES[task.msgIndex]}`;
          const nextLogs = [...task.logs, line];
          const shouldFinish = nextLogs.length >= COMPLETE_AFTER_LINES;

          return {
            ...task,
            logs: nextLogs,
            msgIndex: nextMsgIndex,
            column: shouldFinish ? "done" : "running",
            finishedAt: shouldFinish ? Date.now() : undefined,
          };
        }),
      );
    }, 900);

    return () => clearInterval(timer);
  }, []);

  useInput((input, key) => {
    if (input === "q") {
      process.exit(0);
    }

    if (isOpen) return;

    const keys = tasks.map((task) => task.id);
    if (keys.length === 0) return;

    const current = focusedKey ? keys.indexOf(focusedKey) : -1;

    if (key.downArrow || input === "j") {
      const next = current === -1 ? 0 : Math.min(keys.length - 1, current + 1);
      setFocusedKey(keys[next] ?? null);
    } else if (key.upArrow || input === "k") {
      const next = current <= 0 ? 0 : current - 1;
      setFocusedKey(keys[next] ?? null);
    } else if (key.escape) {
      setFocusedKey(null);
    }
  });

  const columns: KanbanColumn[] = [
    {
      key: "running",
      title: "RUNNING",
      tone: "accent",
      cards: tasks.filter((task) => task.column === "running").map(toCard),
    },
    {
      key: "done",
      title: "DONE",
      tone: "success",
      cards: tasks.filter((task) => task.column === "done").map(toCard),
    },
  ];

  const activeTask = card ? tasks.find((task) => task.id === card.key) ?? null : null;
  const modalCard = activeTask ? toCard(activeTask) : card;

  const sections: ModalSection[] = activeTask
    ? [
        {
          type: "logs",
          label: "📜 Runtime Logs",
          taskLabel: activeTask.name,
          isRunning: activeTask.column === "running",
          lines: activeTask.logs,
          placeholder: "Waiting for first log line...",
          maxVisibleLines: 12,
        },
      ]
    : [];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">
          ink-kanban-board — Modal Live Logs
        </Text>
        <Text color="gray">
          {isOpen
            ? "↑↓: navigate logs • Esc: close modal • q: quit"
            : "↑↓/jk: focus • Enter: open logs modal • q: quit"}
        </Text>
      </Box>

      {isOpen && modalCard && activeTask ? (
        <CardDetailModal
          card={modalCard}
          sections={sections}
          onClose={close}
          title={`LOGS • ${activeTask.id.toUpperCase()}`}
        />
      ) : (
        <KanbanBoard
          columns={columns}
          focusedCardKey={focusedKey}
          breakpoint={breakpoint}
          density={density}
          onCardPress={open}
        />
      )}
    </Box>
  );
}

render(<ModalLiveLogsApp />);
