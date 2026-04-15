import React from "react";
import { Box, Text } from "ink";
import { KanbanCard } from "./kanban-card.js";
import { Panel } from "./ui/panel.js";
import type {
  KanbanBoardProps,
  KanbanCard as KanbanCardType,
  KanbanColumn,
  LayoutDensity,
} from "./types.js";

/**
 * A responsive, density-aware Kanban board for Ink terminal applications.
 *
 * Renders N columns (typically TODO / DOING / DONE) with cards that
 * adapt their layout based on terminal size. Supports focus tracking,
 * overflow indicators, and an optional progress summary bar.
 *
 * @example
 * ```tsx
 * <KanbanBoard
 *   columns={[
 *     { key: "todo", title: "TODO", tone: "warning", cards: todoCards },
 *     { key: "doing", title: "DOING", tone: "accent", cards: doingCards },
 *     { key: "done", title: "DONE", tone: "success", cards: doneCards },
 *   ]}
 *   density="tiny"
 * />
 * ```
 */
export function KanbanBoard({
  columns,
  focusedCardKey = null,
  breakpoint = "medium",
  density = "tiny",
  maxItemsPerColumn = 5,
  showProgress = true,
}: KanbanBoardProps) {
  const direction = breakpoint === "compact" ? "column" : "row";
  const isTiny = density === "tiny";
  const cardGap = isTiny ? 0 : 1;

  const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0);

  return (
    <Box flexDirection="column" gap={isTiny ? 0 : 1} flexGrow={1}>
      {showProgress && (
        <ProgressSummary columns={columns} totalCards={totalCards} density={density} />
      )}
      <Box flexDirection={direction} gap={isTiny ? 0 : 1} flexGrow={1}>
        {columns.map((column) => (
          <ColumnView
            key={column.key}
            column={column}
            focusedCardKey={focusedCardKey}
            maxItems={maxItemsPerColumn}
            density={density}
            cardGap={cardGap}
          />
        ))}
      </Box>
    </Box>
  );
}

// ── Internal components ────────────────────────────────────

interface ColumnViewProps {
  column: KanbanColumn;
  focusedCardKey: string | null;
  maxItems: number;
  density: LayoutDensity;
  cardGap: number;
}

function ColumnView({ column, focusedCardKey, maxItems, density, cardGap }: ColumnViewProps) {
  const { cards, title, tone } = column;
  const isTiny = density === "tiny";

  const visibleCards = sliceAroundFocus(cards, focusedCardKey, maxItems);
  const firstVisibleIndex = visibleCards.length > 0 ? cards.indexOf(visibleCards[0]!) : 0;
  const hiddenBefore = Math.max(0, firstVisibleIndex);
  const hiddenAfter = Math.max(0, cards.length - hiddenBefore - visibleCards.length);

  return (
    <Panel
      title={`${title} (${cards.length})`}
      tone={tone}
      density={density}
      flexGrow={1}
      flexBasis={0}
    >
      <Box flexDirection="column" gap={cardGap}>
        {cards.length === 0 ? (
          <Text color="gray" dimColor>{isTiny ? "—" : "No cards in this column."}</Text>
        ) : (
          <>
            {hiddenBefore > 0 && <Text color="gray">↑ {hiddenBefore}</Text>}
            {visibleCards.map((card) => (
              <KanbanCard
                key={card.key}
                card={card}
                focused={card.key === focusedCardKey}
                density={density}
              />
            ))}
            {hiddenAfter > 0 && <Text color="gray">↓ {hiddenAfter}</Text>}
          </>
        )}
      </Box>
    </Panel>
  );
}

interface ProgressSummaryProps {
  columns: KanbanColumn[];
  totalCards: number;
  density: LayoutDensity;
}

function ProgressSummary({ columns, totalCards, density }: ProgressSummaryProps) {
  if (totalCards === 0) return <Text color="gray">No cards yet...</Text>;

  const isTiny = density === "tiny";
  const barWidth = isTiny ? 12 : 24;

  // Use the last column as "done" for the progress bar
  const doneCount = columns.length > 0 ? columns[columns.length - 1]!.cards.length : 0;
  // Use middle columns as "in progress"
  const doingCount = columns.length > 2
    ? columns.slice(1, -1).reduce((sum, col) => sum + col.cards.length, 0)
    : 0;

  const bar = renderBar(doneCount, doingCount, totalCards, barWidth);

  if (isTiny) {
    return <Text color="gray">{bar} {doneCount}/{totalCards}</Text>;
  }

  const pendingCount = totalCards - doneCount - doingCount;
  return (
    <Text color="gray">
      {bar} {doneCount}/{totalCards} done • {doingCount} active • {pendingCount} pending
    </Text>
  );
}

// ── Utilities ──────────────────────────────────────────────

function renderBar(done: number, doing: number, total: number, width = 24) {
  const doneWidth = Math.round((done / Math.max(1, total)) * width);
  const doingWidth = Math.round((doing / Math.max(1, total)) * width);
  const emptyWidth = Math.max(0, width - doneWidth - doingWidth);
  return `[${"█".repeat(doneWidth)}${"▒".repeat(Math.min(doingWidth, width - doneWidth))}${"·".repeat(emptyWidth)}]`;
}

function sliceAroundFocus(cards: KanbanCardType[], focusedKey: string | null, maxItems: number): KanbanCardType[] {
  if (cards.length <= maxItems) return cards;

  const focusedIndex = focusedKey === null
    ? -1
    : cards.findIndex((c) => c.key === focusedKey);

  if (focusedIndex === -1) return cards.slice(0, maxItems);

  const start = Math.max(
    0,
    Math.min(focusedIndex - Math.floor(maxItems / 2), cards.length - maxItems),
  );
  return cards.slice(start, start + maxItems);
}
