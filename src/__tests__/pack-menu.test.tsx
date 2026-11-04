import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackMenu from "@/app/packs/PackMenu";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<PackMenu startGame={() => {}} />));
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

function viewer() {
  return container.querySelector('[role="dialog"][aria-label="Pack viewer"]');
}

describe("PackMenu", () => {
  it("switches the matchmaking button between same pack and all packs", () => {
    expect(button("Same pack").textContent).toBe("🗡️");
    click(button("Same pack"));
    expect(button("All packs").textContent).toBe("⚔️");
    click(button("All packs"));
    expect(button("Same pack").textContent).toBe("🗡️");
  });

  it("shows the Turtle sprite on the Turtle card", () => {
    const sprite = button("Select Turtle pack").querySelector("img")!;
    expect(sprite.getAttribute("alt")).toBe("Turtle");
  });

  it("selects the Turtle pack by default", () => {
    expect(button("Select Turtle pack").getAttribute("aria-pressed")).toBe("true");
    expect(button("Select new pack").getAttribute("aria-pressed")).toBe("false");
  });

  it("selects the new pack card when ➕ is pressed", () => {
    click(button("Select new pack"));
    expect(button("Select new pack").getAttribute("aria-pressed")).toBe("true");
    expect(button("Select Turtle pack").getAttribute("aria-pressed")).toBe("false");
  });

  it("opens the pack viewer from 🔍 and closes it from ✕", () => {
    expect(viewer()).toBeNull();
    click(button("View Turtle pack"));
    expect(viewer()).not.toBeNull();
    click(button("Close"));
    expect(viewer()).toBeNull();
  });

  it("has a Start game submit button", () => {
    const start = container.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
    expect(start.textContent).toBe("Start game");
  });
});
