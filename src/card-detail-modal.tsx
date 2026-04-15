import React, { useState, useCallback } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import type { Key } from "ink";
import type {
  KanbanCard,
  CardDetailModalProps,
  ModalSection,
  ModalTextSection,
  ModalChecklistSection,
  ModalSelectSection,
  ModalStepsSection,
} from "./types.js";

/**
 * Full-screen modal overlay for inspecting and interacting with a card.
 *
 * Renders on top of the board using absolute positioning.
 * The board continues to render in the background.
 *
 * Navigation:
 * - **Tab / Shift+Tab** — move between sections
 * - **↑↓** — navigate items within checklist / select sections
 * - **←→** — navigate steps in a steps section
 * - **Space / Enter** — toggle checkbox or select option
 * - **Esc** — close the modal
 *
 * @example
 * ```tsx
 * {isOpen && card && (
 *   <CardDetailModal
 *     card={card}
 *     sections={[
 *       { type: "text", label: "Notes", value: notes, onSubmit: addNote },
 *       { type: "checklist", label: "Subtasks", items, onToggle: toggle },
 *       { type: "select", label: "Priority", options, value: prio, onChange: setPrio },
 *       { type: "steps", label: "Pipeline", steps },
 *     ]}
 *     onClose={close}
 *   />
 * )}
 * ```
 */
export function CardDetailModal({
  card,
  sections,
  onClose,
  title,
}: CardDetailModalProps) {
  const { stdout } = useStdout();
  const termWidth = stdout?.columns ?? 80;

  const modalWidth = Math.min(termWidth - 4, 72);

  const [activeIdx, setActiveIdx] = useState(0);
  const [cursors, setCursors] = useState<number[]>(() => sections.map(() => 0));
  const [textBuffer, setTextBuffer] = useState("");

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

  useInput((input: string, key: Key) => {
    if (key.escape) {
      onClose();
      return;
    }

    if (key.tab) {
      setActiveIdx((prev) =>
        key.shift
          ? (prev - 1 + sections.length) % sections.length
          : (prev + 1) % sections.length,
      );
      setTextBuffer("");
      return;
    }

    const section = sections[activeIdx];
    if (!section) return;
    const cursor = cursors[activeIdx] ?? 0;

    switch (section.type) {
      case "text": {
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
          key.escape || key.tab;
        if (input && !isSpecial) {
          setTextBuffer((prev) => prev + input);
        }
        break;
      }

      case "checklist": {
        if (key.upArrow) {
          updateCursor(activeIdx, Math.max(0, cursor - 1));
        } else if (key.downArrow) {
          updateCursor(activeIdx, Math.min(section.items.length - 1, cursor + 1));
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
          updateCursor(activeIdx, Math.max(0, cursor - 1));
        } else if (key.downArrow) {
          updateCursor(activeIdx, Math.min(section.options.length - 1, cursor + 1));
        } else if (key.return) {
          const opt = section.options[cursor];
          if (opt && section.onChange) {
            section.onChange(opt.value);
          }
        }
        break;
      }

      case "steps": {
        if (key.leftArrow) {
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
    }
  });

  return (
    <Box
      position="absolute"
      flexDirection="column"
      width={modalWidth}
      borderStyle="double"
      borderColor="cyanBright"
      paddingX={1}
      paddingY={0}
      marginLeft={Math.max(0, Math.floor((termWidth - modalWidth) / 2))}
      marginTop={1}
    >
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold color="cyanBright">
          {title ?? card.title}
        </Text>
        <Text color="gray">[Esc] Close</Text>
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
            cursor={cursors[i] ?? 0}
            textBuffer={i === activeIdx ? textBuffer : ""}
          />
        ))}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          Tab: sections • ↑↓: items • Space: toggle • Enter: select/submit • Esc: close
        </Text>
      </Box>
    </Box>
  );
}

// ── Section Renderers ──────────────────────────────────────

interface SectionRendererProps {
  section: ModalSection;
  active: boolean;
  cursor: number;
  textBuffer: string;
}

function SectionRenderer({ section, active, cursor, textBuffer }: SectionRendererProps) {
  switch (section.type) {
    case "text":
      return <TextSectionView section={section} active={active} textBuffer={textBuffer} />;
    case "checklist":
      return <ChecklistSectionView section={section} active={active} cursor={cursor} />;
    case "select":
      return <SelectSectionView section={section} active={active} cursor={cursor} />;
    case "steps":
      return <StepsSectionView section={section} active={active} cursor={cursor} />;
  }
}

// ── Text Section ───────────────────────────────────────────

function TextSectionView({
  section,
  active,
  textBuffer,
}: {
  section: ModalTextSection;
  active: boolean;
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
      {section.onSubmit && active && (
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
      {section.onSubmit && !active && (
        <Text color="gray" dimColor>
          (focus to type)
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
      {active && section.onAction && (
        <Text color="gray" dimColor>
          ←→: navigate steps • Enter: trigger action
        </Text>
      )}
    </Box>
  );
}
