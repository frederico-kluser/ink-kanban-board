import React, { useState, useCallback, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";
import type { Key } from "ink";
import type {
  CardDetailModalProps,
  ModalSection,
  ModalTextSection,
  ModalChecklistSection,
  ModalSelectSection,
  ModalStepsSection,
  ModalLogsSection,
} from "./types.js";

const DEFAULT_LOG_VISIBLE_LINES = 10;

/**
 * Interactive modal for inspecting and editing a card's details.
 *
 * Render this **instead of** the board when the modal is open — the board
 * state is preserved in React state while the modal is displayed.
 *
 * Navigation:
 * - **↑↓** — navigate between sections (or items within checklist/select/logs)
 * - **←→** — navigate steps in a steps section
 * - **Tab / Shift+Tab** — jump between sections
 * - **Enter** — enter edit mode (text) / toggle (checklist) / select (select)
 * - **Space** — toggle checkbox (checklist)
 * - **Esc** — exit edit mode (text) or close the modal
 *
 * Logs section behavior:
 * - New lines always render on updates
 * - Viewport auto-follows only when cursor is at the tail
 * - If user scrolls up, viewport stays locked while new logs arrive
 *
 * @example
 * ```tsx
 * {isOpen && card ? (
 *   <CardDetailModal
 *     card={card}
 *     sections={sections}
 *     onClose={close}
 *   />
 * ) : (
 *   <KanbanBoard columns={columns} focusedCardKey={focusedKey} />
 * )}
 * ```
 */
export function CardDetailModal({
  card,
  sections,
  onClose,
  title,
}: CardDetailModalProps) {
  const modalWidth = 72;

  const [activeIdx, setActiveIdx] = useState(0);
  const [cursors, setCursors] = useState<number[]>(() => sections.map(() => 0));
  const [logViewStarts, setLogViewStarts] = useState<number[]>(() => sections.map(() => 0));
  const [textBuffer, setTextBuffer] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const prevLogLengthsRef = useRef<number[]>(
    sections.map((section) => (section.type === "logs" ? section.lines.length : 0)),
  );

  const normalizeIndexedState = useCallback(
    (values: number[]): number[] => {
      if (values.length === sections.length) return values;
      if (values.length > sections.length) return values.slice(0, sections.length);
      return [
        ...values,
        ...Array.from({ length: sections.length - values.length }, () => 0),
      ];
    },
    [sections.length],
  );

  const getVisibleLogLineCount = useCallback((section: ModalLogsSection): number => {
    return Math.max(1, section.maxVisibleLines ?? DEFAULT_LOG_VISIBLE_LINES);
  }, []);

  const updateCursor = useCallback(
    (sectionIdx: number, value: number) => {
      setCursors((prev) => {
        const next = [...prev];
        next[sectionIdx] = value;
        return next;
      });
    },
    [],
  );

  const updateLogViewStart = useCallback(
    (sectionIdx: number, value: number) => {
      setLogViewStarts((prev) => {
        const next = [...prev];
        next[sectionIdx] = value;
        return next;
      });
    },
    [],
  );

  const setLogPosition = useCallback(
    (sectionIdx: number, cursor: number, start: number) => {
      updateCursor(sectionIdx, cursor);
      updateLogViewStart(sectionIdx, start);
    },
    [updateCursor, updateLogViewStart],
  );

  const goToSection = useCallback(
    (direction: "up" | "down") => {
      setActiveIdx((prev) => {
        if (sections.length === 0) return 0;
        if (direction === "up") return Math.max(0, prev - 1);
        return Math.min(sections.length - 1, prev + 1);
      });
      setTextBuffer("");
      setIsEditing(false);
    },
    [sections.length],
  );

  const moveLogCursor = useCallback(
    (sectionIdx: number, direction: "up" | "down") => {
      const section = sections[sectionIdx];
      if (!section || section.type !== "logs") return;

      const lineCount = section.lines.length;
      const visibleLines = getVisibleLogLineCount(section);
      const currentCursor = cursors[sectionIdx] ?? 0;
      const currentStart = logViewStarts[sectionIdx] ?? 0;

      if (lineCount === 0) {
        if (direction === "up" && sectionIdx > 0) goToSection("up");
        if (direction === "down" && sectionIdx < sections.length - 1) goToSection("down");
        return;
      }

      if (direction === "up") {
        if (currentCursor <= 0) {
          if (sectionIdx > 0) goToSection("up");
          return;
        }
        const nextCursor = currentCursor - 1;
        const nextStart = nextCursor < currentStart ? nextCursor : currentStart;
        setLogPosition(sectionIdx, nextCursor, nextStart);
        return;
      }

      if (currentCursor >= lineCount - 1) {
        if (sectionIdx < sections.length - 1) goToSection("down");
        return;
      }

      const nextCursor = currentCursor + 1;
      const nextStart =
        nextCursor >= currentStart + visibleLines
          ? nextCursor - visibleLines + 1
          : currentStart;
      setLogPosition(sectionIdx, nextCursor, nextStart);
    },
    [
      sections,
      cursors,
      logViewStarts,
      getVisibleLogLineCount,
      goToSection,
      setLogPosition,
    ],
  );

  useEffect(() => {
    setActiveIdx((prev) => {
      if (sections.length === 0) return 0;
      return clamp(prev, 0, sections.length - 1);
    });
  }, [sections.length]);

  useEffect(() => {
    const previousLogLengths = prevLogLengthsRef.current;
    const nextLogLengths = sections.map((section) =>
      section.type === "logs" ? section.lines.length : 0,
    );

    let nextCursors = normalizeIndexedState(cursors);
    let nextStarts = normalizeIndexedState(logViewStarts);
    let cursorsChanged = nextCursors !== cursors;
    let startsChanged = nextStarts !== logViewStarts;

    sections.forEach((section, idx) => {
      if (section.type !== "logs") return;

      const lineCount = section.lines.length;
      const visibleLines = getVisibleLogLineCount(section);
      const maxStart = Math.max(0, lineCount - visibleLines);
      const prevLen = previousLogLengths[idx] ?? 0;
      const prevCursor = nextCursors[idx] ?? 0;
      const wasAtTail = prevLen === 0 || prevCursor >= prevLen - 1;
      const grew = lineCount > prevLen;

      let cursor = lineCount === 0 ? 0 : clamp(prevCursor, 0, lineCount - 1);
      let start = clamp(nextStarts[idx] ?? 0, 0, maxStart);

      if (lineCount === 0) {
        cursor = 0;
        start = 0;
      } else if (grew && wasAtTail) {
        cursor = lineCount - 1;
        start = maxStart;
      } else {
        if (cursor < start) start = cursor;
        if (cursor >= start + visibleLines) {
          start = cursor - visibleLines + 1;
        }
        start = clamp(start, 0, maxStart);
      }

      if (cursor !== nextCursors[idx]) {
        if (!cursorsChanged) {
          nextCursors = [...nextCursors];
          cursorsChanged = true;
        }
        nextCursors[idx] = cursor;
      }

      if (start !== nextStarts[idx]) {
        if (!startsChanged) {
          nextStarts = [...nextStarts];
          startsChanged = true;
        }
        nextStarts[idx] = start;
      }
    });

    prevLogLengthsRef.current = nextLogLengths;

    if (cursorsChanged) setCursors(nextCursors);
    if (startsChanged) setLogViewStarts(nextStarts);
  }, [
    sections,
    cursors,
    logViewStarts,
    normalizeIndexedState,
    getVisibleLogLineCount,
  ]);

  useInput((input: string, key: Key) => {
    const section = sections[activeIdx];
    if (!section) return;
    const cursor = cursors[activeIdx] ?? 0;

    // ── Text editing mode: captures all input ──
    if (isEditing && section.type === "text") {
      if (key.escape) {
        setIsEditing(false);
        return;
      }
      if (!section.onSubmit) return;
      if (key.return) {
        if (textBuffer.trim()) {
          section.onSubmit(textBuffer);
          setTextBuffer("");
        }
        return;
      }
      if (key.backspace || key.delete) {
        setTextBuffer((prev) => prev.slice(0, -1));
        return;
      }
      const isSpecial =
        key.upArrow || key.downArrow || key.leftArrow || key.rightArrow ||
        key.tab;
      if (input && !isSpecial) {
        setTextBuffer((prev) => prev + input);
      }
      return;
    }

    // ── Normal modal navigation ──

    if (key.escape) {
      onClose();
      return;
    }

    // Tab / Shift+Tab: jump between sections
    if (key.tab) {
      if (sections.length === 0) return;
      setActiveIdx((prev) =>
        key.shift
          ? (prev - 1 + sections.length) % sections.length
          : (prev + 1) % sections.length,
      );
      setTextBuffer("");
      return;
    }

    switch (section.type) {
      case "text": {
        if (key.upArrow) { goToSection("up"); }
        else if (key.downArrow) { goToSection("down"); }
        else if (key.return && section.onSubmit) { setIsEditing(true); }
        break;
      }

      case "checklist": {
        if (key.upArrow) {
          if (cursor <= 0) goToSection("up");
          else updateCursor(activeIdx, cursor - 1);
        } else if (key.downArrow) {
          if (cursor >= section.items.length - 1) goToSection("down");
          else updateCursor(activeIdx, cursor + 1);
        } else if (input === " " || key.return) {
          const item = section.items[cursor];
          if (item && section.onToggle) {
            section.onToggle(item.key, !item.checked);
          }
        }
        break;
      }

      case "select": {
        if (key.upArrow) {
          if (cursor <= 0) goToSection("up");
          else updateCursor(activeIdx, cursor - 1);
        } else if (key.downArrow) {
          if (cursor >= section.options.length - 1) goToSection("down");
          else updateCursor(activeIdx, cursor + 1);
        } else if (key.return) {
          const opt = section.options[cursor];
          if (opt && section.onChange) {
            section.onChange(opt.value);
          }
        }
        break;
      }

      case "steps": {
        if (key.upArrow) { goToSection("up"); }
        else if (key.downArrow) { goToSection("down"); }
        else if (key.leftArrow) {
          updateCursor(activeIdx, Math.max(0, cursor - 1));
        } else if (key.rightArrow) {
          updateCursor(activeIdx, Math.min(section.steps.length - 1, cursor + 1));
        } else if (key.return) {
          const step = section.steps[cursor];
          if (step && section.onAction) {
            section.onAction(step.key);
          }
        }
        break;
      }

      case "logs": {
        if (key.upArrow) {
          moveLogCursor(activeIdx, "up");
        } else if (key.downArrow) {
          moveLogCursor(activeIdx, "down");
        }
        break;
      }
    }
  });

  // ── Contextual help text ──
  const activeSection = sections[activeIdx];
  const helpText = buildHelpText(activeSection, isEditing);

  return (
    <Box
      flexDirection="column"
      width={modalWidth}
      borderStyle="double"
      borderColor="cyanBright"
      paddingX={1}
      paddingY={0}
      alignSelf="center"
    >
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold color="cyanBright">
          {title ?? card.title}
        </Text>
        <Text color="gray">[Esc] {isEditing ? "Stop editing" : "Close"}</Text>
      </Box>

      {/* Card summary */}
      <Box gap={1}>
        <Text color={card.status.color}>● {card.status.label}</Text>
        {card.subtitle && (
          <Text color="gray" dimColor>
            — {card.subtitle}
          </Text>
        )}
      </Box>

      {/* Sections */}
      <Box flexDirection="column" marginTop={1}>
        {sections.map((section, i) => (
          <SectionRenderer
            key={`${section.type}-${i}`}
            section={section}
            active={i === activeIdx}
            editing={i === activeIdx && isEditing}
            cursor={cursors[i] ?? 0}
            logViewStart={logViewStarts[i] ?? 0}
            textBuffer={i === activeIdx ? textBuffer : ""}
          />
        ))}
      </Box>

      {/* Footer — contextual shortcuts */}
      <Box marginTop={1} flexDirection="column">
        <Text color="yellow" dimColor>
          {helpText}
        </Text>
        <Text color="gray" dimColor>
          Section {activeIdx + 1}/{sections.length}
          {activeSection ? ` — ${activeSection.label}` : ""}
        </Text>
      </Box>
    </Box>
  );
}

// ── Help text builder ──────────────────────────────────────

function buildHelpText(section: ModalSection | undefined, isEditing: boolean): string {
  if (!section) return "Esc: close";

  if (isEditing && section.type === "text") {
    return "Type to write • Enter: submit • Backspace: delete • Esc: stop editing";
  }

  switch (section.type) {
    case "text":
      return section.onSubmit
        ? "Enter: start typing • ↑↓: sections • Tab: jump section • Esc: close"
        : "↑↓: sections • Tab: jump section • Esc: close";
    case "checklist":
      return "↑↓: items (overflow → next section) • Space/Enter: toggle • Esc: close";
    case "select":
      return "↑↓: options (overflow → next section) • Enter: select • Esc: close";
    case "steps":
      return "←→: steps • Enter: action • ↑↓: sections • Esc: close";
    case "logs":
      return "↑↓: logs (auto-follow only at tail) • Tab: jump section • Esc: close";
  }
}

// ── Section Renderers ──────────────────────────────────────

interface SectionRendererProps {
  section: ModalSection;
  active: boolean;
  editing: boolean;
  cursor: number;
  logViewStart: number;
  textBuffer: string;
}

function SectionRenderer({
  section,
  active,
  editing,
  cursor,
  logViewStart,
  textBuffer,
}: SectionRendererProps) {
  switch (section.type) {
    case "text":
      return <TextSectionView section={section} active={active} editing={editing} textBuffer={textBuffer} />;
    case "checklist":
      return <ChecklistSectionView section={section} active={active} cursor={cursor} />;
    case "select":
      return <SelectSectionView section={section} active={active} cursor={cursor} />;
    case "steps":
      return <StepsSectionView section={section} active={active} cursor={cursor} />;
    case "logs":
      return (
        <LogsSectionView
          section={section}
          active={active}
          cursor={cursor}
          logViewStart={logViewStart}
        />
      );
  }
}

// ── Text Section ───────────────────────────────────────────

function TextSectionView({
  section,
  active,
  editing,
  textBuffer,
}: {
  section: ModalTextSection;
  active: boolean;
  editing: boolean;
  textBuffer: string;
}) {
  const borderColor = active ? "cyanBright" : "gray";
  const lines = section.value ? section.value.split("\n") : [];

  return (
    <Box
      flexDirection="column"
      borderStyle={active ? "bold" : "single"}
      borderColor={borderColor}
      paddingX={1}
    >
      <Text bold color={borderColor}>
        {section.label}
        {editing && <Text color="yellow"> (editing)</Text>}
      </Text>
      {lines.length > 0 && (
        <Box flexDirection="column">
          {lines.map((line, i) => (
            <Text key={i} color="white" wrap="truncate-end">
              {line}
            </Text>
          ))}
        </Box>
      )}
      {section.onSubmit && editing && (
        <Box>
          <Text color="cyan">❯ </Text>
          <Text color="white">{textBuffer}</Text>
          <Text color="gray" dimColor>
            {textBuffer.length === 0 && section.placeholder
              ? section.placeholder
              : "█"}
          </Text>
        </Box>
      )}
      {section.onSubmit && active && !editing && (
        <Text color="gray" dimColor>
          Press Enter to start typing
        </Text>
      )}
    </Box>
  );
}

// ── Checklist Section ──────────────────────────────────────

function ChecklistSectionView({
  section,
  active,
  cursor,
}: {
  section: ModalChecklistSection;
  active: boolean;
  cursor: number;
}) {
  const borderColor = active ? "cyanBright" : "gray";

  return (
    <Box
      flexDirection="column"
      borderStyle={active ? "bold" : "single"}
      borderColor={borderColor}
      paddingX={1}
    >
      <Text bold color={borderColor}>
        {section.label}
      </Text>
      {section.items.map((item, i) => {
        const isCursor = active && i === cursor;
        const check = item.checked ? "✓" : " ";
        return (
          <Text key={item.key} color={isCursor ? "cyanBright" : "white"} bold={isCursor}>
            {isCursor ? "❯" : " "} [{check}] {item.label}
          </Text>
        );
      })}
    </Box>
  );
}

// ── Select Section ─────────────────────────────────────────

function SelectSectionView({
  section,
  active,
  cursor,
}: {
  section: ModalSelectSection;
  active: boolean;
  cursor: number;
}) {
  const borderColor = active ? "cyanBright" : "gray";

  return (
    <Box
      flexDirection="column"
      borderStyle={active ? "bold" : "single"}
      borderColor={borderColor}
      paddingX={1}
    >
      <Text bold color={borderColor}>
        {section.label}
      </Text>
      {section.options.map((opt, i) => {
        const isSelected = opt.value === section.value;
        const isCursor = active && i === cursor;
        return (
          <Text
            key={opt.value}
            color={isCursor ? "cyanBright" : isSelected ? "green" : "white"}
            bold={isCursor}
          >
            {isCursor ? "❯" : isSelected ? "●" : " "} {opt.label}
            {isSelected && !isCursor ? " ✓" : ""}
          </Text>
        );
      })}
    </Box>
  );
}

// ── Logs Section ────────────────────────────────────────────

function LogsSectionView({
  section,
  active,
  cursor,
  logViewStart,
}: {
  section: ModalLogsSection;
  active: boolean;
  cursor: number;
  logViewStart: number;
}) {
  const borderColor = active ? "cyanBright" : "gray";
  const visibleCount = Math.max(1, section.maxVisibleLines ?? DEFAULT_LOG_VISIBLE_LINES);
  const totalLines = section.lines.length;
  const maxStart = Math.max(0, totalLines - visibleCount);
  const start = clamp(logViewStart, 0, maxStart);
  const boundedCursor = totalLines === 0 ? 0 : clamp(cursor, 0, totalLines - 1);
  const visibleLines = section.lines.slice(start, start + visibleCount);
  const statusColor = section.isRunning ? "cyan" : "green";
  const statusLabel = section.isRunning ? "Running" : "Stopped";
  const isAtTail = totalLines > 0 && boundedCursor >= totalLines - 1;

  return (
    <Box
      flexDirection="column"
      borderStyle={active ? "bold" : "single"}
      borderColor={borderColor}
      paddingX={1}
    >
      <Text bold color={borderColor}>
        {section.label}
      </Text>
      <Box justifyContent="space-between">
        <Text color="gray">
          Task: {section.taskLabel}
        </Text>
        <Text color={statusColor}>
          ● {statusLabel}
        </Text>
      </Box>

      {totalLines === 0 ? (
        <Text color="gray" dimColor>
          {section.placeholder ?? "Waiting for logs..."}
        </Text>
      ) : (
        <Box flexDirection="column">
          {visibleLines.map((line, idx) => {
            const absoluteIdx = start + idx;
            const isCursor = active && absoluteIdx === boundedCursor;
            return (
              <Text key={absoluteIdx} color={isCursor ? "cyanBright" : "white"} bold={isCursor} wrap="truncate-end">
                {isCursor ? "❯" : " "} {line}
              </Text>
            );
          })}
        </Box>
      )}

      <Text color="gray" dimColor>
        {totalLines > 0
          ? `Line ${boundedCursor + 1}/${totalLines} • ${isAtTail ? "Following new lines" : "Scroll locked"}`
          : "Line 0/0 • Waiting for updates"}
      </Text>
    </Box>
  );
}

// ── Steps Section ──────────────────────────────────────────

const STEP_ICON: Record<string, string> = {
  done: "✓",
  active: "◆",
  pending: "○",
  error: "✗",
};

const STEP_COLOR: Record<string, string> = {
  done: "green",
  active: "cyan",
  pending: "gray",
  error: "red",
};

function StepsSectionView({
  section,
  active,
  cursor,
}: {
  section: ModalStepsSection;
  active: boolean;
  cursor: number;
}) {
  const borderColor = active ? "cyanBright" : "gray";

  return (
    <Box
      flexDirection="column"
      borderStyle={active ? "bold" : "single"}
      borderColor={borderColor}
      paddingX={1}
    >
      <Text bold color={borderColor}>
        {section.label}
      </Text>
      <Box>
        {section.steps.map((step, i) => {
          const icon = STEP_ICON[step.status] ?? "○";
          const color = STEP_COLOR[step.status] ?? "gray";
          const isCursor = active && i === cursor;
          const arrow = i < section.steps.length - 1 ? " → " : "";
          return (
            <Text key={step.key}>
              <Text
                color={isCursor ? "cyanBright" : color}
                bold={isCursor}
                underline={isCursor}
              >
                {icon} {step.label}
              </Text>
              {arrow && <Text color="gray">{arrow}</Text>}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
