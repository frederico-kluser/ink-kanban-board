#!/usr/bin/env tsx
/**
 * ink-kanban-board — Focus & Navigation Demo
 *
 * Run with: npm run demo:focus
 *
 * Demonstrates keyboard focus navigation across cards with
 * overflow indicators (↑ ↓) when maxItemsPerColumn is exceeded.
 */
import React, { useState } from "react";
import { render, Box, Text, useInput } from "ink";
import {
  KanbanBoard,
  useTerminalSize,
  type KanbanCardData,
  type KanbanColumn,
} from "../src/index.js";

function makeCards(
  prefix: string,
  count: number,
  statusLabel: string,
  statusColor: string,
): KanbanCardData[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}-${i + 1}`,
    title: `${prefix.toUpperCase()} ${String(i + 1).padStart(2, "0")}`,
    subtitle: `Description for ${prefix}-${i + 1}`,
    status: { label: statusLabel, color: statusColor },
    startedAt: Date.now() - (count - i) * 60_000,
  }));
}

const allCards: KanbanCardData[] = [
  ...makeCards("backlog", 8, "Pending", "gray"),
  ...makeCards("active", 4, "Running", "cyan"),
  ...makeCards("done", 6, "Done", "green"),
];

function FocusApp() {
  const { breakpoint, density } = useTerminalSize();
  const [focusIdx, setFocusIdx] = useState(0);

  useInput((input, key) => {
    if (key.downArrow || input === "j")
      setFocusIdx((i) => Math.min(allCards.length - 1, i + 1));
    else if (key.upArrow || input === "k")
      setFocusIdx((i) => Math.max(0, i - 1));
    else if (key.escape) setFocusIdx(-1);
    else if (input === "q") process.exit(0);
  });

  const focusedKey = focusIdx >= 0 ? allCards[focusIdx]!.key : null;

  const columns: KanbanColumn[] = [
    {
      key: "backlog",
      title: "BACKLOG",
      tone: "warning",
      cards: allCards.filter((c) => c.key.startsWith("backlog")),
    },
    {
      key: "active",
      title: "ACTIVE",
      tone: "accent",
      cards: allCards.filter((c) => c.key.startsWith("active")),
    },
    {
      key: "done",
      title: "DONE",
      tone: "success",
      cards: allCards.filter((c) => c.key.startsWith("done")),
    },
  ];

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">ink-kanban-board — Focus Navigation</Text>
        <Text color="gray">
          ↑↓/jk: navigate • esc: unfocus • q: quit • focused: {focusedKey ?? "none"}
        </Text>
      </Box>
      <KanbanBoard
        columns={columns}
        focusedCardKey={focusedKey}
        breakpoint={breakpoint}
        density={density}
        maxItemsPerColumn={4}
      />
    </Box>
  );
}

render(<FocusApp />);
