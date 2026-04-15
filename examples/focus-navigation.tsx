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
  const [focusedKey, setFocusedKey] = useState<string | null>(allCards[0]?.key ?? null);

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

  // 2D navigation: ↑↓/jk within column, ←→/hl across columns
  useInput((input, key) => {
    let col = -1, row = -1;
    if (focusedKey) {
      for (let c = 0; c < columns.length; c++) {
        const r = columns[c]!.cards.findIndex((card) => card.key === focusedKey);
        if (r !== -1) { col = c; row = r; break; }
      }
    }

    if (key.downArrow || input === "j") {
      if (col === -1) {
        const first = columns.find((c) => c.cards.length > 0);
        if (first) setFocusedKey(first.cards[0]!.key);
      } else {
        const next = Math.min(columns[col]!.cards.length - 1, row + 1);
        setFocusedKey(columns[col]!.cards[next]!.key);
      }
    } else if (key.upArrow || input === "k") {
      if (col === -1) return;
      const next = Math.max(0, row - 1);
      setFocusedKey(columns[col]!.cards[next]!.key);
    } else if (key.rightArrow || input === "l") {
      const nextCol = col === -1 ? 0 : Math.min(columns.length - 1, col + 1);
      const target = columns[nextCol]!.cards;
      if (target.length > 0) {
        setFocusedKey(target[Math.min(row < 0 ? 0 : row, target.length - 1)]!.key);
      }
    } else if (key.leftArrow || input === "h") {
      const nextCol = col === -1 ? 0 : Math.max(0, col - 1);
      const target = columns[nextCol]!.cards;
      if (target.length > 0) {
        setFocusedKey(target[Math.min(row < 0 ? 0 : row, target.length - 1)]!.key);
      }
    } else if (key.escape) {
      setFocusedKey(null);
    } else if (input === "q") {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1} justifyContent="space-between">
        <Text bold color="cyan">ink-kanban-board — Focus Navigation</Text>
        <Text color="gray">
          ↑↓/jk ←→/hl: navigate • esc: unfocus • q: quit • focused: {focusedKey ?? "none"}
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
