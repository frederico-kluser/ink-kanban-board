import React from "react";
import { Box, Text, type BoxProps } from "ink";
import type { LayoutDensity, Tone } from "../types.js";

interface PanelProps extends BoxProps {
  title?: string;
  subtitle?: string;
  tone?: Tone;
  footer?: React.ReactNode;
  density?: LayoutDensity;
  children: React.ReactNode;
}

interface StatCardProps extends BoxProps {
  label: string;
  value: string;
  detail?: string;
  tone?: Tone;
  density?: LayoutDensity;
}

interface PillProps {
  label: string;
  tone?: Tone;
  strong?: boolean;
  density?: LayoutDensity;
}

const TONE_COLORS: Record<Tone, string> = {
  neutral: "gray",
  accent: "cyan",
  success: "green",
  warning: "yellow",
  danger: "red",
};

export function Panel({
  title,
  subtitle,
  tone = "neutral",
  footer,
  density = "tiny",
  children,
  ...boxProps
}: PanelProps) {
  const borderColor = TONE_COLORS[tone];
  const isTiny = density === "tiny";

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={isTiny ? 0 : 1}
      paddingY={isTiny ? 0 : 1}
      {...boxProps}
    >
      {(title || subtitle) && (
        <Box flexDirection="column" marginBottom={children && !isTiny ? 1 : 0}>
          {title && (
            <Text bold color={borderColor}>
              {title}
            </Text>
          )}
          {subtitle && !isTiny && (
            <Text color="gray" dimColor>
              {subtitle}
            </Text>
          )}
        </Box>
      )}

      <Box flexDirection="column" flexGrow={1}>
        {children}
      </Box>

      {footer && !isTiny && <Box marginTop={1}>{footer}</Box>}
    </Box>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = "neutral",
  density = "tiny",
  ...boxProps
}: StatCardProps) {
  const accent = TONE_COLORS[tone];
  const isTiny = density === "tiny";

  if (isTiny) {
    return (
      <Box flexGrow={1} gap={1} {...boxProps}>
        <Text color={TONE_COLORS[tone]}>{label}:</Text>
        <Text bold color={accent}>{value}</Text>
      </Box>
    );
  }

  return (
    <Panel title={label} tone={tone} density={density} minHeight={5} flexGrow={1} {...boxProps}>
      <Text bold color={accent}>
        {value}
      </Text>
      {detail && (
        <Text color="gray" dimColor>
          {detail}
        </Text>
      )}
    </Panel>
  );
}

export function Pill({ label, tone = "neutral", strong = false, density = "tiny" }: PillProps) {
  const borderColor = TONE_COLORS[tone];

  if (density === "tiny") {
    return (
      <Box marginRight={1}>
        <Text color={borderColor} bold={strong}>
          {label}
        </Text>
      </Box>
    );
  }

  return (
    <Box borderStyle="round" borderColor={borderColor} paddingX={1} marginRight={1}>
      <Text color={borderColor} bold={strong}>
        {label}
      </Text>
    </Box>
  );
}
