import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackEditor from "@/app/packs/editor/PackEditor";
import { PET_REGISTRY } from "@/lib/pets";

// jsdom has no layout, so dnd-kit can't run a real drag. Capture the viewer's
// onDragEnd instead, and call it with the drop dnd-kit would report.
type DragEndEvent = {
  canceled: boolean;
  operation: { source: { initialGroup: string; group: string; initialIndex: number; index: number } };
};
let onDragEnd: (event: DragEndEvent) => void;

vi.mock("@dnd-kit/react", () => ({
  DragDropProvider: (props: { children: ReactNode; onDragEnd: (event: DragEndEvent) => void }) => {
    onDragEnd = props.onDragEnd;
    return props.children;
  },
}));

vi.mock("@dnd-kit/react/sortable", () => ({
  isSortable: () => true,
  useSortable: () => ({ ref: () => {} }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<PackEditor />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function button(label: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}

function click(element: HTMLElement) {
  act(() => element.click());
}

// Picks items in order, then opens the viewer.
function buildPack(names: string[]) {
  names.forEach((name) => click(button(name)));
  click(button("View pack"));
}

function drop(group: string, initialIndex: number, index: number, { initialGroup = group, canceled = false } = {}) {
  act(() => onDragEnd({ canceled, operation: { source: { initialGroup, group, initialIndex, index } } }));
}

function exportedCode(): { Minions: number[]; Spells: number[] } {
  click(button("Close"));
  click(button("Pack settings"));
  const settings = container.querySelector('[role="dialog"][aria-label="Pack settings"]')!;
  click([...settings.querySelectorAll("button")].find((element) => element.textContent === "Export")!);
  return JSON.parse(settings.querySelector<HTMLInputElement>('[aria-label="Pack code"]')!.value);
}

const id = (name: string) => PET_REGISTRY[name].id;

describe("rearranging in the pack viewer", () => {
  it("moves a pet within its tier, which saves in the code", () => {
    buildPack(["Ant", "Beaver", "Cricket"]);
    drop("pets:0", 2, 0);
    expect(exportedCode().Minions).toEqual([id("Cricket"), id("Ant"), id("Beaver")]);
  });

  it("moves a pet down within its tier", () => {
    buildPack(["Ant", "Beaver", "Cricket"]);
    drop("pets:0", 0, 2);
    expect(exportedCode().Minions).toEqual([id("Beaver"), id("Cricket"), id("Ant")]);
  });

  it("moves a food within its tier", () => {
    buildPack(["Apple", "Asparagus"]);
    drop("foods:0", 1, 0);
    expect(exportedCode().Spells).toEqual([27, 1]);
  });

  it("ignores a drop in another group", () => {
    buildPack(["Ant", "Crab"]);
    drop("pets:1", 0, 0, { initialGroup: "pets:0" });
    expect(exportedCode().Minions).toEqual([id("Ant"), id("Crab")]);
  });

  it("ignores a canceled drag", () => {
    buildPack(["Ant", "Beaver"]);
    drop("pets:0", 1, 0, { canceled: true });
    expect(exportedCode().Minions).toEqual([id("Ant"), id("Beaver")]);
  });
});
