import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { Spinner } from "@inkjs/ui";
import type { KanbanCard as KanbanCardType, LayoutDensity } from "./types.js";
import { Pill } from "./ui/panel.js";

export interface KanbanCardProps {
  card: KanbanCardType;
  focused?: boolean;
  density?: LayoutDensity;
  /** When true, shows a "⏎" hint indicating Enter triggers an action. */
  showEnterHint?: boolean;
}

/**
 * A single Kanban card rendered inside a column.
 *
 * Adapts its layout based on `density`:
 * - **tiny**: compact card with title + status + time
 * - **spacious**: multi-line card with progress bar, metadata, context, contentLines, and time
 *
 * The time line (`startedAt → now` or `startedAt → finishedAt`) is always the last row.
 */
export function KanbanCard({ card, focused = false, density = "tiny", showEnterHint = false }: KanbanCardProps) {
  const { status } = card;
  const isTiny = density === "tiny";
  const isTimerActive = !!card.startedAt && !card.finishedAt;
  const now = useNow(isTimerActive);

  const timeLine = card.startedAt
    ? {
        short: `${fmtShort(card.startedAt)}\u2192${fmtShort(card.finishedAt ?? now)}`,
        full: `${fmtFull(card.startedAt)} \u2192 ${fmtFull(card.finishedAt ?? now)}`,
      }
    : null;

  // ── Tiny mode: compact card (title + status + time) ──
  if (isTiny) {
    return (
      <Box
        flexDirection="column"
        borderStyle={focused ? "bold" : "single"}
        borderColor={focused ? "cyanBright" : card.isPreview ? "gray" : status.color}
        paddingX={0}
        paddingY={0}
      >
        <Box>
          <Text color={card.isPreview ? "gray" : "cyan"} bold>{shorten(card.title, 18)}</Text>
          <Text color={status.color}> {status.label}</Text>
          {showEnterHint && <Text color="gray" dimColor> ⏎</Text>}
        </Box>
        {timeLine && <Text color="gray" dimColor>{timeLine.short}</Text>}
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
          {showEnterHint && <Text color="gray" dimColor> ⏎</Text>}
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

      {/* Row 6+: Content lines (variable-height) */}
      {card.contentLines && card.contentLines.length > 0 && (
        <Box flexDirection="column">
          {card.contentLines.map((line, i) => (
            <Text key={i} color="white" wrap="truncate-end">{line}</Text>
          ))}
        </Box>
      )}

      {/* Last row: Time line (always last) */}
      {timeLine && <Text color="gray" dimColor>{timeLine.full}</Text>}
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

/** Ticks `Date.now()` every second while `active` is true. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function fmtFull(epoch: number): string {
  const d = new Date(epoch);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function fmtShort(epoch: number): string {
  const d = new Date(epoch);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
