import { useStdout } from "ink";
import { useEffect, useState } from "react";
import type { TerminalBreakpoint, LayoutDensity, TerminalViewport } from "../types.js";

/**
 * Hook that tracks terminal dimensions and derives responsive breakpoints.
 *
 * Returns `TerminalViewport` with width, height, breakpoint, density, and isShort.
 * Automatically updates on terminal resize.
 */
export function useTerminalSize(): TerminalViewport {
  const { stdout } = useStdout();
  const [size, setSize] = useState(() => readTerminalSize(stdout));

  useEffect(() => {
    if (!stdout) return;

    const handleResize = () => {
      setSize(readTerminalSize(stdout));
    };

    stdout.on("resize", handleResize);
    return () => {
      stdout.off("resize", handleResize);
    };
  }, [stdout]);

  const breakpoint = resolveBreakpoint(size.width);
  const density = resolveDensity(size.width, size.height);

  return {
    ...size,
    breakpoint,
    density,
    isShort: size.height < 34,
  };
}

function readTerminalSize(stdout?: NodeJS.WriteStream | null) {
  return {
    width: stdout?.columns ?? 80,
    height: stdout?.rows ?? 24,
  };
}

function resolveBreakpoint(width: number): TerminalBreakpoint {
  if (width >= 150) return "wide";
  if (width >= 110) return "medium";
  return "compact";
}

function resolveDensity(width: number, height: number): LayoutDensity {
  if (width >= 150 && height >= 45) return "spacious";
  return "tiny";
}
