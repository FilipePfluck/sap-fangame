import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackMenu from "@/app/packs/PackMenu";
import type { SavedPackJson } from "@/lib/game/pack-request";

const INCOMPLETE_PACK: SavedPackJson = { id: 7, pack: { name: "Zoo", icon: 1, pets: [1], foods: [], isValid: false } };
// Beaver, Otter and Pig: three tier 1 Cycle pets.
const WILD_PACK: SavedPackJson = { id: 8, pack: { name: "Cycles", icon: 2, pets: [2, 8, 9], foods: [], isValid: false } };
// Turtle's 60 pets (IDs 1–60) and three foods per tier, as in pack.test.ts.
const VALID_PACK: SavedPackJson = {
  id: 9,
  pack: {
    name: "Full",
    icon: 1,
    pets: Array.from({ length: 60 }, (_, index) => index + 1),
    foods: [1, 2, 27, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    isValid: true,
  },
};

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  renderMenu();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
});

const startGame = vi.fn(async () => {});
const abandonGame = vi.fn(async () => {});

function renderMenu({ savedPacks = [], activeGameId = null }: { savedPacks?: readonly SavedPackJson[]; activeGameId?: string | null } = {}) {
  act(() =>
    root.render(
      <PackMenu startGame={startGame} abandonGame={abandonGame} activeGameId={activeGameId} savedPacks={savedPacks} />
    )
  );
}

function button(label: string): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
}

function click(element: HTMLElement) {
  act(() => element.click());
}

// The tooltip listens on its wrapper, the button's parent.
function hover(element: HTMLElement) {
  act(() => {
    element.parentElement!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
}

function renderSavedPacks(savedPacks: readonly SavedPackJson[]) {
  renderMenu({ savedPacks });
}

function buttonWithText(text: string): HTMLButtonElement {
  return [...container.querySelectorAll("button")].find((element) => element.textContent === text)!;
}

function newPackCard(): HTMLElement {
  return container.querySelector<HTMLElement>('[aria-label="New custom pack"]')!;
}

function statusLabels(packName: string): string[] {
  const labels = button(`Select ${packName} pack`).querySelectorAll("span span");
  return [...labels].map((label) => label.textContent!);
}

function tooltip() {
  return document.querySelector('[role="tooltip"]')?.textContent;
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

  it("shows a tooltip for the current matchmaking mode", () => {
    hover(button("Same pack"));
    expect(tooltip()).toBe("Same pack\nPlay against your own pack.");
    click(button("Same pack"));
    hover(button("All packs"));
    expect(tooltip()).toBe("All packs\nPlay against all packs.");
  });

  it("shows a View pack tooltip on 🔍", () => {
    hover(button("View pack"));
    expect(tooltip()).toBe("View pack");
  });

  it("titles the ➕ card Custom", () => {
    expect(newPackCard().textContent).toBe("➕Custom");
  });

  it("shows the Turtle sprite on the Turtle card", () => {
    const sprite = button("Select Turtle pack").querySelector("img")!;
    expect(sprite.getAttribute("alt")).toBe("Turtle");
  });

  it("selects the Turtle pack by default", () => {
    expect(button("Select Turtle pack").getAttribute("aria-pressed")).toBe("true");
  });

  it("opens the pack viewer from 🔍 and closes it from ✕", () => {
    expect(viewer()).toBeNull();
    click(button("View pack"));
    expect(viewer()).not.toBeNull();
    click(button("Close"));
    expect(viewer()).toBeNull();
  });

  it("links ➕ to a new pack in the editor", () => {
    expect(newPackCard().getAttribute("href")).toBe("/packs/editor");
  });

  it("has a Start game submit button", () => {
    const start = container.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
    expect(start.textContent).toBe("Start game");
  });

  describe("saved packs", () => {
    it("shows a card for each saved pack", () => {
      renderSavedPacks([INCOMPLETE_PACK, WILD_PACK]);
      const cards = [...container.querySelectorAll("button[aria-pressed]")].map((card) => card.getAttribute("aria-label"));
      expect(cards).toEqual(["Select Turtle pack", "Select Zoo pack", "Select Cycles pack"]);
    });

    it("shows the saved pack's icon", () => {
      renderSavedPacks([WILD_PACK]);
      expect(button("Select Cycles pack").querySelector("img")!.getAttribute("alt")).toBe("Beaver");
    });

    it("labels a pack that can't start a game Invalid", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      expect(statusLabels("Zoo")).toEqual(["Invalid"]);
    });

    it("labels a pack past the tag limits WILD", () => {
      renderSavedPacks([WILD_PACK]);
      expect(statusLabels("Cycles")).toEqual(["Invalid", "WILD"]);
    });

    it("doesn't label a valid pack Invalid", () => {
      renderSavedPacks([VALID_PACK]);
      expect(statusLabels("Full")).toEqual(["WILD"]);
    });

    it("selects a saved pack", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      click(button("Select Zoo pack"));
      expect(button("Select Zoo pack").getAttribute("aria-pressed")).toBe("true");
    });

    it("deselects Turtle when a saved pack is selected", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      click(button("Select Zoo pack"));
      expect(button("Select Turtle pack").getAttribute("aria-pressed")).toBe("false");
    });

    it("links 🔧 to the saved pack in the editor", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      expect(container.querySelector('a[aria-label="Edit pack"]')!.getAttribute("href")).toBe("/packs/editor?packId=7");
    });

    it("opens the saved pack in the pack viewer", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      click(button("Select Zoo pack").parentElement!.querySelector<HTMLButtonElement>('button[aria-label="View pack"]')!);
      expect(viewer()).not.toBeNull();
    });

    it("disables Start game for a pack that isn't valid", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      click(button("Select Zoo pack"));
      expect(container.querySelector<HTMLButtonElement>('form button[type="submit"]')!.disabled).toBe(true);
    });

    it("says what a pack needs before it can start a game", () => {
      renderSavedPacks([INCOMPLETE_PACK]);
      click(button("Select Zoo pack"));
      hover(container.querySelector<HTMLElement>("form")!);
      expect(tooltip()).toBe("Finish this pack to play it: 10 pets and 3 foods in every tier, an allowed name and an icon.");
    });

    it("enables Start game for a valid pack", () => {
      renderSavedPacks([VALID_PACK]);
      click(button("Select Full pack"));
      expect(container.querySelector<HTMLButtonElement>('form button[type="submit"]')!.disabled).toBe(false);
    });

    it("starts the game with the selected pack", async () => {
      renderSavedPacks([VALID_PACK]);
      click(button("Select Full pack"));
      await act(async () => container.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click());
      expect(startGame).toHaveBeenCalledWith(9, expect.any(FormData));
    });

    it("disables ➕ at 5 saved packs", () => {
      renderSavedPacks([5, 6, 7, 8, 9].map((id) => ({ ...INCOMPLETE_PACK, id })));
      expect(newPackCard().getAttribute("aria-disabled")).toBe("true");
    });
  });

  describe("game in progress", () => {
    beforeEach(() => renderMenu({ activeGameId: "game-1" }));

    it("links Continue to the game", () => {
      const continueLink = [...container.querySelectorAll("a")].find((link) => link.textContent === "Continue")!;
      expect(continueLink.getAttribute("href")).toBe("/arena/game-1");
    });

    it("hides Start game", () => {
      expect(container.querySelector('form button[type="submit"]')).toBeNull();
    });

    it("asks before abandoning", () => {
      click(buttonWithText("Abandon"));
      expect(container.querySelector('[role="group"][aria-label="Abandon game"] span')!.textContent).toBe(
        "Abandon your game? It will be deleted."
      );
    });

    it("abandons the game once confirmed", async () => {
      click(buttonWithText("Abandon"));
      await act(async () => buttonWithText("Abandon game").click());
      expect(abandonGame).toHaveBeenCalledWith("game-1");
    });

    it("keeps the game from Keep playing", () => {
      click(buttonWithText("Abandon"));
      click(buttonWithText("Keep playing"));
      expect(abandonGame).not.toHaveBeenCalled();
    });
  });
});
