import React from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { KanbanCard as KanbanCardType, LayoutDensity } from "./types.js";
import { Pill } from "./ui/panel.js";

export interface KanbanCardProps {
  card: KanbanCardType;
  focused?: boolean;
  density?: LayoutDensity;
}

/**
 * A single Kanban card rendered inside a column.
 *
 * Adapts its layout based on `density`:
 * - **tiny**: single-line compact card
 * - **spacious**: multi-line card with progress bar, metadata, and context
 */
export function KanbanCard({ card, focused = false, density = "tiny" }: KanbanCardProps) {
  const { status } = card;
  const isTiny = density === "tiny";

  // ── Tiny mode: single-line card ──
  if (isTiny) {
    return (
      <Box
        borderStyle={focused ? "bold" : "single"}
        borderColor={focused ? "cyanBright" : card.isPreview ? "gray" : status.color}
        paddingX={0}
        paddingY={0}
      >
        <Text color={card.isPreview ? "gray" : "cyan"} bold>{shorten(card.title, 12)}</Text>
        <Text color={status.color}> {status.label}</Text>
        {card.subtitle && <Text color="white" wrap="truncate-end"> {shorten(card.subtitle, 20)}</Text>}
        {card.metadata && card.metadata.length > 0 && (
          <Text color="gray" dimColor wrap="truncate-end"> {card.metadata[0]!.label}</Text>
        )}
      </Box>
    );
  }

  // ── Spacious mode: multi-line card ──
  const metaLine = card.metadata && card.metadata.length > 0
    ? card.metadata.map((m) => m.label).join(" • ")
    : null;

  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? "bold" : "round"}
      borderColor={focused ? "cyanBright" : card.isPreview ? "gray" : status.color}
      paddingX={1}
      paddingY={0}
    >
      {/* Row 1: Title + Status */}
      <Box justifyContent="space-between">
        <Pill
          label={card.title}
          tone={card.isPreview ? "neutral" : "accent"}
          strong={!card.isPreview}
          density={density}
        />
        <Box>
          {status.spinning && <Spinner type="dots" />}
          <Text color={status.color} bold> {status.label}</Text>
        </Box>
      </Box>

      {/* Row 2: Subtitle */}
      {card.subtitle && (
        <Text color="white" wrap="truncate-end">{card.subtitle}</Text>
      )}

      {/* Row 3: Progress bar */}
      {card.progress != null && (
        <Text color="gray">{renderProgress(card.progress, 14, status.color)}</Text>
      )}

      {/* Row 4: Metadata */}
      {metaLine && <Text color="gray" wrap="truncate-end">{metaLine}</Text>}

      {/* Row 5: Context / log line */}
      {card.contextLine && (
        <Text
          color={card.contextIsError ? "red" : "gray"}
          dimColor={!card.contextIsError}
          wrap="truncate-end"
        >
          {card.contextLine}
        </Text>
      )}
    </Box>
  );
}

function renderProgress(progress: number, width: number, _color: string) {
  const filled = Math.round(width * progress);
  return `[${"█".repeat(filled)}${"·".repeat(Math.max(0, width - filled))}] ${Math.round(progress * 100)}%`;
}

function shorten(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}
