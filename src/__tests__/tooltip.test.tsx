import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import Tooltip from "@/app/arena/[gameId]/Tooltip";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TARGET_ID = "tooltip-target";

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

function renderPages(pages: readonly string[]) {
  act(() =>
    root.render(
      <Tooltip pages={pages}>
        <span id={TARGET_ID} />
      </Tooltip>
    )
  );
}

function target() {
  return document.getElementById(TARGET_ID)!;
}

function hover() {
  act(() => {
    target().dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
}

function unhover() {
  act(() => {
    target().dispatchEvent(
      new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })
    );
  });
}

function click() {
  act(() => target().click());
}

function tooltipText() {
  return document.querySelector('[role="tooltip"]')?.textContent;
}

describe("Tooltip pages", () => {
  it("steps through the pages on click and cycles back to the first", () => {
    renderPages(["Deer", "Bus", "Chili"]);
    hover();
    expect(tooltipText()).toBe("Deer1/3");

    click();
    expect(tooltipText()).toBe("Bus2/3");

    click();
    expect(tooltipText()).toBe("Chili3/3");

    click();
    expect(tooltipText()).toBe("Deer1/3");
  });

  it("returns to the first page after leaving", () => {
    renderPages(["Deer", "Bus", "Chili"]);
    hover();
    click();
    unhover();
    expect(tooltipText()).toBeUndefined();

    hover();
    expect(tooltipText()).toBe("Deer1/3");
  });

  it("shows no counter or paging for a single page", () => {
    renderPages(["Duck"]);
    hover();
    click();
    expect(tooltipText()).toBe("Duck");
  });
});
