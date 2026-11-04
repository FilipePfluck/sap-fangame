import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackEditor from "@/app/packs/editor/PackEditor";

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

function pressed(label: string): boolean {
  return button(label).getAttribute("aria-pressed") === "true";
}

function click(element: HTMLElement) {
  act(() => element.click());
}

function settingsModal() {
  return container.querySelector('[role="dialog"][aria-label="Pack settings"]');
}

function searchInput(): HTMLInputElement {
  return container.querySelector<HTMLInputElement>('input[aria-label="Search"]')!;
}

// React tracks input values, so set it through the native setter.
function typeSearch(text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(searchInput(), text);
    searchInput().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("PackEditor", () => {
  it("shows the six tier dice in order", () => {
    const dice = [1, 2, 3, 4, 5, 6].map((tier) => button(`Tier ${tier}`).textContent);
    expect(dice).toEqual(["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]);
  });

  it("selects a tier die, and deselects it on a second click", () => {
    click(button("Tier 3"));
    expect(pressed("Tier 3")).toBe(true);
    click(button("Tier 3"));
    expect(pressed("Tier 3")).toBe(false);
  });

  it("selects only one tier at a time", () => {
    click(button("Tier 3"));
    click(button("Tier 5"));
    expect(pressed("Tier 3")).toBe(false);
    expect(pressed("Tier 5")).toBe(true);
  });

  it("selects only one tag at a time", () => {
    click(button("Hurt"));
    click(button("Summon"));
    expect(pressed("Hurt")).toBe(false);
    expect(pressed("Summon")).toBe(true);
  });

  // Each button's tooltip repeats its label.
  it.each(["Hurt", "Level-Up", "Super", "View pack", "Pack settings"])("shows a %s tooltip", (label) => {
    act(() => {
      button(label).parentElement!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(document.querySelector('[role="tooltip"]')?.textContent).toBe(label);
  });

  it("shows a paw on the view pack button", () => {
    expect(button("View pack").textContent).toBe("🐾");
  });

  it("treats Super as a tag", () => {
    click(button("Hurt"));
    click(button("Super"));
    expect(pressed("Hurt")).toBe(false);
    expect(pressed("Super")).toBe(true);
  });

  it("keeps a tier and a tag selected together", () => {
    click(button("Tier 2"));
    click(button("Hurt"));
    expect(pressed("Tier 2")).toBe(true);
    expect(pressed("Hurt")).toBe(true);
  });

  it("clears the search with ✕", () => {
    typeSearch("blowfish");
    expect(searchInput().value).toBe("blowfish");
    click(button("Clear search"));
    expect(searchInput().value).toBe("");
  });

  it("opens the pack viewer from 🐾", () => {
    click(button("View pack"));
    expect(container.querySelector('[role="dialog"][aria-label="Pack viewer"]')).not.toBeNull();
  });

  it("opens the settings modal from 🔧 with all six buttons disabled", () => {
    click(button("Pack settings"));
    const modal = settingsModal()!;
    expect(modal.getAttribute("aria-modal")).toBe("true");
    const settings = [...modal.querySelectorAll<HTMLButtonElement>("button:disabled")];
    expect(settings.map((setting) => setting.textContent)).toEqual([
      "Change name",
      "Randomize",
      "Export",
      "Import",
      "Discard changes",
      "Delete",
    ]);
  });

  it("closes the settings modal from ✕", () => {
    click(button("Pack settings"));
    click(settingsModal()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!);
    expect(settingsModal()).toBeNull();
  });
});
