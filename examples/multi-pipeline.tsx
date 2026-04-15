#!/usr/bin/env tsx
/**
 * ink-kanban-board — CI/CD Pipeline (5 Columns)
 *
 * Run with: npm run demo:pipeline
 *
 * Demonstrates a board with 5 columns representing CI/CD stages.
 * Services move through QUEUE → BUILD → TEST → DEPLOY → LIVE automatically.
 * Shows that the board supports any number of columns, not just 3.
 */
import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput } from "ink";
import {
  KanbanBoard,
  useTerminalSize,
  type KanbanCardData,
  type KanbanColumn,
  type Tone,
} from "../src/index.js";

const STAGES = ["queue", "build", "test", "deploy", "live"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_CFG: Record<
  Stage,
  { title: string; tone: Tone; label: string; color: string; spinning: boolean }
> = {
  queue:  { title: "QUEUE",  tone: "neutral", label: "Queued",    color: "gray",    spinning: false },
  build:  { title: "BUILD",  tone: "warning", label: "Building",  color: "yellow",  spinning: true },
  test:   { title: "TEST",   tone: "accent",  label: "Testing",   color: "cyan",    spinning: true },
  deploy: { title: "DEPLOY", tone: "danger",  label: "Deploying", color: "magenta", spinning: true },
  live:   { title: "LIVE",   tone: "success", label: "Live",      color: "green",   spinning: false },
};

const SERVICES = [
  "api-gateway",
  "auth-svc",
  "user-svc",
  "billing-svc",
  "notifications",
  "analytics",
  "search-svc",
  "cdn-worker",
];

interface PipelineItem {
  id: string;
  name: string;
  stage: Stage;
  startedAt: number;
  finishedAt?: number;
}

function createItems(): PipelineItem[] {
  return SERVICES.map((name, i) => ({
    id: `svc-${i}`,
    name,
    stage: "queue" as Stage,
    startedAt: Date.now(),
  }));
}

function PipelineApp() {
  const { breakpoint, density } = useTerminalSize();
  const [items, setItems] = useState(createItems);

  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) => {
        const next = prev.map((item) => ({ ...item }));
        for (const item of next) {
          const idx = STAGES.indexOf(item.stage);
          if (idx < STAGES.length - 1 && Math.random() > 0.55) {
            item.stage = STAGES[idx + 1]!;
            if (item.stage === "live") item.finishedAt = Date.now();
          }
        }
        if (next.every((it) => it.stage === "live")) return createItems();
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useInput((input) => {
    if (input === "q") process.exit(0);
  });

  const columns: KanbanColumn[] = STAGES.map((stage) => {
    const cfg = STAGE_CFG[stage];
    const cards: KanbanCardData[] = items
      .filter((it) => it.stage === stage)
      .map((it) => ({
        key: it.id,
        title: it.name.toUpperCase(),
        subtitle: it.name,
        status: { label: cfg.label, color: cfg.color, spinning: cfg.spinning },
        startedAt: it.startedAt,
        finishedAt: it.finishedAt,
      }));
    return { key: stage, title: cfg.title, tone: cfg.tone, cards };
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">ink-kanban-board — CI/CD Pipeline (5 columns)</Text>
        <Text color="gray">q: quit</Text>
      </Box>
      <KanbanBoard
        columns={columns}
        breakpoint={breakpoint}
        density={density}
        maxItemsPerColumn={5}
      />
    </Box>
  );
}

render(<PipelineApp />);
