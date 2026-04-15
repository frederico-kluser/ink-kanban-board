#!/usr/bin/env tsx
/**
 * ink-kanban-board — Heterogeneous Cards Example
 *
 * Run with: npm run demo:hetero
 *
 * Demonstrates cards with different amounts of content,
 * resulting in different visual heights on the board.
 * Forces `density="spacious"` to show all detail rows.
 */
import React from "react";
import { render, Box, Text } from "ink";
import {
  KanbanBoard,
  type KanbanColumn,
} from "../src/index.js";

const columns: KanbanColumn[] = [
  {
    key: "backlog",
    title: "BACKLOG",
    tone: "neutral",
    cards: [
      {
        key: "minimal",
        title: "MINIMAL",
        status: { label: "Idle", color: "gray" },
        // No subtitle, no contentLines — smallest card
      },
      {
        key: "with-subtitle",
        title: "WITH SUBTITLE",
        subtitle: "This card has a subtitle only",
        status: { label: "Queued", color: "yellow" },
      },
    ],
  },
  {
    key: "in-progress",
    title: "IN PROGRESS",
    tone: "accent",
    cards: [
      {
        key: "rich-card",
        title: "DEPLOY v2.4",
        subtitle: "Production deployment pipeline",
        status: { label: "Running", color: "cyan", spinning: true },
        progress: 0.65,
        metadata: [
          { label: "env: prod" },
          { label: "region: us-east-1" },
          { label: "12m 34s" },
        ],
        contextLine: "Step 4/6: Running integration tests...",
        contentLines: [
          "> docker build -t app:v2.4 .",
          "> kubectl apply -f deploy.yaml",
          "> Waiting for rollout...",
        ],
      },
      {
        key: "logs-card",
        title: "DATA SYNC",
        subtitle: "Syncing warehouse tables",
        status: { label: "Streaming", color: "blueBright", spinning: true },
        progress: 0.32,
        contentLines: [
          "users       ████████░░░░ 67%",
          "orders      ████░░░░░░░░ 33%",
          "products    ██░░░░░░░░░░ 18%",
          "analytics   ░░░░░░░░░░░░  2%",
          "sessions    — pending",
        ],
      },
    ],
  },
  {
    key: "done",
    title: "DONE",
    tone: "success",
    cards: [
      {
        key: "done-simple",
        title: "LINT FIX",
        status: { label: "Done", color: "green" },
        metadata: [{ label: "3 files" }, { label: "0.4s" }],
      },
      {
        key: "done-detailed",
        title: "DB MIGRATION",
        subtitle: "migrate_v41_add_indexes.sql",
        status: { label: "Done", color: "green" },
        metadata: [
          { label: "$0.0012" },
          { label: "2.1s" },
        ],
        contextLine: "Applied 3 migrations successfully",
        contentLines: [
          "ALTER TABLE users ADD INDEX idx_email;",
          "ALTER TABLE orders ADD INDEX idx_created;",
        ],
      },
      {
        key: "done-error",
        title: "SEED SCRIPT",
        status: { label: "Error", color: "red" },
        contextLine: "UNIQUE constraint failed: users.email",
        contextIsError: true,
        contentLines: [
          "Inserted 1,200 rows into users",
          "Inserted 8,400 rows into orders",
          "FAILED at row 1,201 — duplicate key",
        ],
      },
    ],
  },
];

function HeterogeneousApp() {
  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">ink-kanban-board — Heterogeneous Cards</Text>
        <Text color="gray">  (spacious mode, different card sizes)</Text>
      </Box>
      <KanbanBoard
        columns={columns}
        breakpoint="wide"
        density="spacious"
        maxItemsPerColumn={8}
      />
    </Box>
  );
}

render(<HeterogeneousApp />);
