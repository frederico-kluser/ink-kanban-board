#!/usr/bin/env tsx
/**
 * ink-kanban-board — Live Logs / contentLines Demo
 *
 * Run with: npm run demo:logs
 *
 * Demonstrates streaming `contentLines` — each card receives new
 * log lines every second. Only the last N lines are kept, creating
 * a "tail -f" effect inside each card.
 */
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput } from "ink";
import {
  KanbanBoard,
  useTerminalSize,
  type KanbanCardData,
  type KanbanColumn,
} from "../src/index.js";

const LOG_MESSAGES = [
  "Connecting to database...",
  "Authenticating user token",
  "Fetching configuration from vault",
  "Compiling assets (1/3)...",
  "Compiling assets (2/3)...",
  "Compiling assets (3/3)...",
  "Running lint checks",
  "Running unit tests... 42 passed",
  "Running integration tests",
  "Uploading artifacts to S3",
  "Invalidating CDN cache",
  "Health check: 200 OK",
  "Scaling replicas to 3",
  "Updating DNS records",
  "Deploy complete, verifying...",
];

const WORKERS = ["worker-alpha", "worker-beta", "worker-gamma"];
const MAX_VISIBLE_LINES = 4;

interface WorkerState {
  id: string;
  name: string;
  logs: string[];
  msgIndex: number;
  startedAt: number;
}

function createWorkers(): WorkerState[] {
  return WORKERS.map((name, i) => ({
    id: `w-${i}`,
    name,
    logs: [],
    msgIndex: Math.floor(Math.random() * LOG_MESSAGES.length),
    startedAt: Date.now(),
  }));
}

function LiveLogsApp() {
  const { breakpoint, density } = useTerminalSize();
  const [workers, setWorkers] = useState(createWorkers);

  useEffect(() => {
    const timer = setInterval(() => {
      setWorkers((prev) =>
        prev.map((w) => {
          const nextIdx = (w.msgIndex + 1) % LOG_MESSAGES.length;
          const ts = new Date().toLocaleTimeString("en-US", { hour12: false });
          const newLine = `[${ts}] ${LOG_MESSAGES[w.msgIndex]!}`;
          return {
            ...w,
            msgIndex: nextIdx,
            logs: [...w.logs, newLine].slice(-MAX_VISIBLE_LINES),
          };
        }),
      );
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  useInput((input) => {
    if (input === "q") process.exit(0);
  });

  const cards: KanbanCardData[] = workers.map((w) => ({
    key: w.id,
    title: w.name.toUpperCase(),
    subtitle: `PID ${10000 + parseInt(w.id.split("-")[1]!, 10)}`,
    status: { label: "Running", color: "cyan", spinning: true },
    contentLines: w.logs.length > 0 ? w.logs : undefined,
    startedAt: w.startedAt,
  }));

  const columns: KanbanColumn[] = [
    {
      key: "running",
      title: "RUNNING",
      tone: "accent",
      cards,
    },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">ink-kanban-board — Live Logs</Text>
        <Text color="gray">q: quit • Streaming contentLines every 1.5s</Text>
      </Box>
      <KanbanBoard
        columns={columns}
        breakpoint={breakpoint}
        density={density}
      />
    </Box>
  );
}

render(<LiveLogsApp />);
