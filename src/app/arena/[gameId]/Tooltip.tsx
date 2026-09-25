"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  text?: string;
  className?: string;
  children: React.ReactNode;
};

const BOX_WIDTH = 256;
const EDGE_MARGIN = 8;

type Placement = { x: number; y: number; below: boolean; width: number; maxHeight: number };

// Hover tooltip rendered in a portal with fixed positioning so scrolling or
// overflow-clipped containers (like the shop rows) can't cut it off.
// `className` replaces the default `relative` when the wrapped child needs its
// own positioning moved onto this wrapper instead (e.g. an absolutely-
// positioned badge).
export default function Tooltip({ text, className, children }: TooltipProps) {
  const [placement, setPlacement] = useState<Placement | null>(null);

  if (!text) return <>{children}</>;

  function show(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = Math.min(BOX_WIDTH, window.innerWidth - EDGE_MARGIN * 2);
    const half = width / 2 + EDGE_MARGIN;
    const x = Math.min(Math.max(rect.left + rect.width / 2, half), window.innerWidth - half);
    const spaceAbove = rect.top - EDGE_MARGIN;
    const spaceBelow = window.innerHeight - rect.bottom - EDGE_MARGIN;
    const below = rect.top < 90 || spaceBelow > spaceAbove;
    const maxHeight = Math.max(80, (below ? spaceBelow : spaceAbove) - EDGE_MARGIN);
    setPlacement({ x, y: below ? rect.bottom : rect.top, below, width, maxHeight });
  }

  return (
    <div
      className={className ?? "relative"}
      onMouseEnter={show}
      onMouseLeave={() => setPlacement(null)}
    >
      {children}
      {placement &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              left: placement.x,
              top: placement.y,
              width: placement.width,
              maxHeight: placement.maxHeight,
              transform: placement.below ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
            }}
            className="pointer-events-none z-50 overflow-y-auto whitespace-pre-line rounded-md border border-zinc-300 bg-white p-2 text-left text-xs text-zinc-700 shadow-lg dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {text}
          </div>,
          document.body
        )}
    </div>
  );
}
