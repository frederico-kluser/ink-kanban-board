#!/usr/bin/env tsx
/**
 * ink-kanban-board — Minimal Quick Start
 *
 * Run with: npm run demo:minimal
 *
 * The simplest possible board: 3 static columns, a few cards,
 * no state, no timers. Perfect starting point to understand the API.
 */
import React from "react";
import { render, Box, Text } from "ink";
import { KanbanBoard, type KanbanColumn } from "../src/index.js";

const columns: KanbanColumn[] = [
  {
    key: "todo",
    title: "TODO",
    tone: "warning",
    cards: [
      { key: "t1", title: "TASK 01", status: { label: "Pending", color: "gray" } },
      { key: "t2", title: "TASK 02", status: { label: "Pending", color: "gray" } },
      { key: "t3", title: "TASK 03", status: { label: "Pending", color: "gray" } },
    ],
  },
  {
    key: "doing",
    title: "DOING",
    tone: "accent",
    cards: [
      { key: "t4", title: "TASK 04", status: { label: "Running", color: "cyan", spinning: true } },
    ],
  },
  {
    key: "done",
    title: "DONE",
    tone: "success",
    cards: [
      { key: "t5", title: "TASK 05", status: { label: "Done", color: "green" } },
      { key: "t6", title: "TASK 06", status: { label: "Done", color: "green" } },
    ],
  },
];

function App() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">ink-kanban-board — Minimal</Text>
      <KanbanBoard columns={columns} density="tiny" />
    </Box>
  );
}

render(<App />);
