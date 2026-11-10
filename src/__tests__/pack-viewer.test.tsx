import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackViewer from "@/app/arena/[gameId]/PackViewer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<PackViewer onClose={() => {}} />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function shown(name: string): boolean {
  return container.querySelector(`img[alt="${name}"]`) !== null;
}

function toggleCustomExclusive() {
  act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
}

describe("PackViewer", () => {
  it("shows Turtle's pets and foods by default", () => {
    expect([shown("Ant"), shown("Apple"), shown("Chinchilla"), shown("Asparagus")]).toEqual([true, true, false, false]);
  });

  it("swaps to the custom pets and foods when Custom exclusive is checked", () => {
    toggleCustomExclusive();
    expect([shown("Ant"), shown("Apple"), shown("Chinchilla"), shown("Asparagus")]).toEqual([false, false, true, true]);
  });

  it("swaps back when Custom exclusive is unchecked", () => {
    toggleCustomExclusive();
    toggleCustomExclusive();
    expect([shown("Ant"), shown("Chinchilla")]).toEqual([true, false]);
  });
});
