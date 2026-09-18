"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  text?: string;
  className?: string;
  children: React.ReactNode;
};

const BOX_WIDTH = 160;
const EDGE_MARGIN = 8;

type Placement = { x: number; y: number; below: boolean };

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
    const half = BOX_WIDTH / 2 + EDGE_MARGIN;
    const x = Math.min(Math.max(rect.left + rect.width / 2, half), window.innerWidth - half);
    const below = rect.top < 90;
    setPlacement({ x, y: below ? rect.bottom : rect.top, below });
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
              width: BOX_WIDTH,
              transform: placement.below ? "translate(-50%, 8px)" : "translate(-50%, calc(-100% - 8px))",
            }}
            className="pointer-events-none z-50 rounded-md border border-zinc-300 bg-white p-2 text-center text-xs text-zinc-700 shadow-lg dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {text}
          </div>,
          document.body
        )}
    </div>
  );
}
