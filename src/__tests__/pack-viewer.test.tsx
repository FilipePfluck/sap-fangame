import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackViewer from "@/app/arena/[gameId]/PackViewer";
import { Pack, TURTLE_PACK } from "@/lib/game/pack";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(pack: Pack) {
  act(() => root.render(<PackViewer pack={pack} onClose={() => {}} />));
}

function shown(name: string): boolean {
  return container.querySelector(`img[alt="${name}"]`) !== null;
}

function toggleCustomExclusive() {
  act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
}

describe("PackViewer for a static pack", () => {
  beforeEach(() => render(TURTLE_PACK));

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

describe("PackViewer for a custom pack", () => {
  // Chinchilla (69) and Asparagus (27) in tier 1.
  const customPack = Pack.fromSerialized({ name: "My Pack", icon: 69, pets: [69], foods: [27], isValid: false });

  beforeEach(() => render(customPack));

  it("shows the pack's pets and foods", () => {
    expect([shown("Chinchilla"), shown("Asparagus"), shown("Ant"), shown("Apple")]).toEqual([true, true, false, false]);
  });

  it("has no Custom exclusive checkbox", () => {
    expect(container.querySelector('input[type="checkbox"]')).toBeNull();
  });
});
