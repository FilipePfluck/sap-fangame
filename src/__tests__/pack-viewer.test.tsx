import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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

  it("labels each row with its tier", () => {
    const labels = [...container.querySelectorAll("span")].map((span) => span.textContent);
    expect(labels.filter((label) => label?.startsWith("Tier"))).toEqual(["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Tier 5", "Tier 6"]);
  });

  it("shows Turtle's pets and foods by default", () => {
    expect([shown("Ant"), shown("Apple"), shown("Chinchilla"), shown("Asparagus")]).toEqual([true, true, false, false]);
  });

  it("swaps to the custom pets and foods when Custom exclusive is checked", () => {
    toggleCustomExclusive();
    expect([shown("Ant"), shown("Apple"), shown("Chinchilla"), shown("Asparagus")]).toEqual([false, false, true, true]);
  });

  it("can't be rearranged outside the pack editor", async () => {
    // Give dnd-kit the time it takes to mark sprites draggable.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(container.querySelectorAll('[aria-roledescription="draggable"]')).toHaveLength(0);
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

describe("PackViewer with move callbacks", () => {
  // Ant (1) and Beaver (2), then Apple (1).
  // dnd-kit marks the sprites draggable after rendering.
  beforeEach(async () => {
    await act(async () =>
      root.render(
        <PackViewer
          pack={Pack.fromSerialized({ name: "My Pack", icon: 1, pets: [1, 2], foods: [1], isValid: false })}
          onClose={() => {}}
          onMovePet={() => {}}
          onMoveFood={() => {}}
        />
      )
    );
  });

  it("makes every pet and food draggable", async () => {
    await vi.waitFor(() => {
      const draggable = container.querySelectorAll('[aria-roledescription="draggable"]');
      expect([...draggable].map((sprite) => sprite.getAttribute("aria-label"))).toEqual(["Ant", "Beaver", "Apple"]);
    });
  });
});
