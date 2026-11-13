import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import PackEditor from "@/app/packs/editor/PackEditor";
import { PET_REGISTRY } from "@/lib/pets";

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

function rightClick(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
  });
}

function settingsModal() {
  return container.querySelector('[role="dialog"][aria-label="Pack settings"]');
}

function searchInput(): HTMLInputElement {
  return container.querySelector<HTMLInputElement>('input[aria-label="Search"]')!;
}

// React tracks input values, so set it through the native setter.
function typeInto(input: HTMLInputElement, text: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  act(() => {
    setValue.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function typeSearch(text: string) {
  typeInto(searchInput(), text);
}

function section(tier: number) {
  return container.querySelector(`section[aria-label="Tier ${tier} section"]`);
}

function shownTiers(): string[] {
  return [...container.querySelectorAll("section")].map((tierSection) => tierSection.getAttribute("aria-label")!);
}

// The pet and food buttons, leaving out each tier's die and tags.
function itemNames(scope: ParentNode = container): string[] {
  return [...scope.querySelectorAll('[aria-label$=" pets"] button, [aria-label$=" foods"] button')].map(
    (item) => item.getAttribute("aria-label")!
  );
}

// Honey is also a tag, so look in the tier's section.
function tierOneItem(name: string): HTMLButtonElement {
  return section(1)!.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
}

function tierOnePets(): HTMLButtonElement[] {
  return [...section(1)!.querySelectorAll<HTMLButtonElement>('[aria-label="Tier 1 pets"] button')];
}

function countLabel(tier: number, text: string): HTMLElement | undefined {
  return [...section(tier)!.querySelectorAll<HTMLElement>("span")].find((span) => span.textContent === text);
}

function tagIcon(petName: string, tagLabel: string): Element {
  return container.querySelector(`[aria-label="${petName} tags"] img[alt="${tagLabel}"]`)!;
}

function status(): string {
  return container.querySelector('[aria-label="Pack status"]')!.textContent!;
}

function settingsButton(label: string): HTMLButtonElement {
  return [...settingsModal()!.querySelectorAll("button")].find((element) => element.textContent === label)!;
}

function openSetting(label: string) {
  click(button("Pack settings"));
  click(settingsButton(label));
}

function importCode(code: string) {
  openSetting("Import");
  typeInto(settingsInput("Pack code"), code);
  click(settingsButton("Import"));
}

function settingsInput(label: string): HTMLInputElement {
  return settingsModal()!.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
}

describe("PackEditor", () => {
  it("shows the six tier dice in order", () => {
    const dice = [1, 2, 3, 4, 5, 6].map((tier) => button(`Tier ${tier}`).textContent);
    expect(dice).toEqual(["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]);
  });

  it("shows the archetypes in display order, then Super", () => {
    const tagLabels = [...container.querySelectorAll('[role="group"][aria-label="Tags"] img')]
      .map((icon) => icon.getAttribute("alt"))
      .filter((alt) => alt !== null);
    expect(tagLabels).toEqual([
      "Summon",
      "Hurt",
      "Food",
      "Guard",
      "Perk",
      "Ailment",
      "Cycle",
      "Roll",
      "Level-Up",
      "Gold",
      "Toy",
      "Transform",
      "Buff",
      "Disruption",
      "Biome",
      "Collapse",
      "Honey",
      "Leavings",
      "Rings",
      "Shield",
      "Shift",
      "Super",
    ]);
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

  it("opens the settings modal from 🔧 with Delete disabled until packs are saved", () => {
    click(button("Pack settings"));
    const modal = settingsModal()!;
    const settings = [...modal.querySelectorAll<HTMLButtonElement>("button:not([aria-label])")];
    expect([modal.getAttribute("aria-modal"), settings.map((setting) => [setting.textContent, setting.disabled])]).toEqual([
      "true",
      [
        ["Change name", false],
        ["Export", false],
        ["Import", false],
        ["Randomize", false],
        ["Clear", false],
        ["Delete", true],
      ],
    ]);
  });

  it("closes the settings modal from ✕", () => {
    click(button("Pack settings"));
    click(settingsModal()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!);
    expect(settingsModal()).toBeNull();
  });

  describe("building a pack", () => {
    it("shows every tier", () => {
      expect(shownTiers()).toEqual([
        "Tier 1 section",
        "Tier 2 section",
        "Tier 3 section",
        "Tier 4 section",
        "Tier 5 section",
        "Tier 6 section",
      ]);
    });

    it("starts each tier with no pets", () => {
      expect(countLabel(1, "Pets 0 / 10")).toBeDefined();
    });

    it("adds a pet when clicked", () => {
      click(button("Ant"));
      expect(pressed("Ant")).toBe(true);
    });

    it("counts an added pet", () => {
      click(button("Ant"));
      expect(countLabel(1, "Pets 1 / 10")).toBeDefined();
    });

    it("removes a pet on a second click", () => {
      click(button("Ant"));
      click(button("Ant"));
      expect(pressed("Ant")).toBe(false);
    });

    it("adds a food when clicked", () => {
      click(tierOneItem("Asparagus"));
      expect(pressed("Asparagus")).toBe(true);
    });

    it("counts an added food", () => {
      click(tierOneItem("Asparagus"));
      expect(countLabel(1, "Foods 1 / 3")).toBeDefined();
    });

    it("lets a tier go past 10 pets", () => {
      tierOnePets().slice(0, 11).forEach(click);
      expect(countLabel(1, "Pets 11 / 10")).toBeDefined();
    });

    it("shows a pet's tags above it, with one Super icon per Super tag", () => {
      const tagIcons = container.querySelectorAll('[aria-label="Spider tags"] img');
      expect([...tagIcons].map((icon) => icon.getAttribute("alt"))).toEqual(["Summon", "Super", "Super"]);
    });

    it("counts a tier's Super tags", () => {
      click(button("Spider"));
      expect(section(2)!.querySelector('[aria-label="Tier 2 Super 2"]')).not.toBeNull();
    });

    it("shows the pack being edited in the viewer", () => {
      click(button("Ant"));
      click(button("View pack"));
      const viewer = container.querySelector('[role="dialog"][aria-label="Pack viewer"]')!;
      expect(viewer.querySelector('img[alt="Ant"]')).not.toBeNull();
    });
  });

  describe("invalid reasons", () => {
    it("marks a tier's pet count red until it has 10", () => {
      expect(countLabel(1, "Pets 0 / 10")!.className).toContain("text-red-600");
    });

    it("marks a tier's food count red until it has 3", () => {
      expect(countLabel(1, "Foods 0 / 3")!.className).toContain("text-red-600");
    });

    it("doesn't mark a full tier's count red", () => {
      ["Apple", "Honey", "Asparagus"].forEach((name) => click(tierOneItem(name)));
      expect(countLabel(1, "Foods 3 / 3")!.className).not.toContain("text-red-600");
    });

    it("marks a count past 10 pets red", () => {
      tierOnePets().slice(0, 11).forEach(click);
      expect(countLabel(1, "Pets 11 / 10")!.className).toContain("text-red-600");
    });

    it("marks the pets in a tier past 10 pets red", () => {
      tierOnePets().slice(0, 11).forEach(click);
      expect(tierOnePets()[0].className).toContain("border-red-600");
    });

    it("marks a blank name red", () => {
      openSetting("Change name");
      typeInto(settingsInput("Pack name"), " ");
      expect(container.querySelector('[aria-label="Pack name"]:not(input)')!.className).toContain("text-red-600");
    });
  });

  describe("WILD reasons", () => {
    it("is Standard with 2 Hurt pets in a tier", () => {
      click(button("Hedgehog"));
      click(button("Peacock"));
      expect(status()).toBe("Standard");
    });

    it("marks selected pets green when they don't make the pack WILD", () => {
      click(button("Hedgehog"));
      click(button("Peacock"));
      expect(button("Hedgehog").className).toContain("border-green-600");
    });

    it("is WILD with 3 Hurt pets in a tier", () => {
      ["Hedgehog", "Peacock", "Rat"].forEach((name) => click(button(name)));
      expect(status()).toBe("WILD");
    });

    it("marks a tier's tag count pink past 2", () => {
      ["Hedgehog", "Peacock", "Rat"].forEach((name) => click(button(name)));
      expect(section(2)!.querySelector('[aria-label="Tier 2 Hurt 3"]')!.className).toContain("text-pink-600");
    });

    it("marks pets with a tag past 2 in their tier pink", () => {
      ["Hedgehog", "Peacock", "Rat"].forEach((name) => click(button(name)));
      expect(button("Rat").className).toContain("border-pink-500");
    });

    it("is WILD with 6 Super tags", () => {
      ["Spider", "Parrot", "Tiger"].forEach((name) => click(button(name)));
      expect(status()).toBe("WILD");
    });

    it("marks the Super count pink past 5", () => {
      ["Spider", "Parrot", "Tiger"].forEach((name) => click(button(name)));
      expect(container.querySelector('[aria-label="Super 6"]')!.className).toContain("text-pink-600");
    });

    it("marks Super pets pink past 5 Super tags", () => {
      ["Spider", "Parrot", "Tiger"].forEach((name) => click(button(name)));
      expect(button("Spider").className).toContain("border-pink-500");
    });

    it("dims a tag on other pets once 2 pets in the tier have it", () => {
      click(button("Hedgehog"));
      click(button("Peacock"));
      expect(tagIcon("Rat", "Hurt").className).toBe("opacity-30");
    });

    it("doesn't dim a selected pet's tag", () => {
      click(button("Hedgehog"));
      click(button("Peacock"));
      expect(tagIcon("Hedgehog", "Hurt").className).toBe("");
    });

    it("dims Super on other pets once the pack has 5 Super tags", () => {
      ["Spider", "Parrot", "Cat"].forEach((name) => click(button(name)));
      expect(tagIcon("Tiger", "Super").className).toBe("opacity-30");
    });
  });

  describe("filters", () => {
    it("narrows the items as you type", () => {
      typeSearch("blowfish");
      expect(itemNames()).toEqual(["Blowfish"]);
    });

    it("shows only the selected tier", () => {
      click(button("Tier 2"));
      expect(shownTiers()).toEqual(["Tier 2 section"]);
    });

    it("shows only pets with the selected tag", () => {
      click(button("Tier 2"));
      click(button("Hurt"));
      expect(new Set(itemNames(section(2)!))).toEqual(new Set(["Hedgehog", "Peacock", "Rat"]));
    });

    it("selects the main die from a tier's dice", () => {
      click(button("Show tier 2"));
      expect(pressed("Tier 2")).toBe(true);
    });

    it("selects the main tag from a tier's tags", () => {
      click(button("Tier 2 Hurt 0"));
      expect(pressed("Hurt")).toBe(true);
    });

    it("doesn't select a tier from a tier's tags", () => {
      click(button("Tier 2 Hurt 0"));
      expect(pressed("Tier 2")).toBe(false);
    });

    it("selects several tiers with right clicks", () => {
      rightClick(button("Tier 2"));
      rightClick(button("Tier 3"));
      expect([pressed("Tier 2"), pressed("Tier 3")]).toEqual([true, true]);
    });

    it("shows every selected tier", () => {
      rightClick(button("Tier 2"));
      rightClick(button("Tier 3"));
      expect(shownTiers()).toEqual(["Tier 2 section", "Tier 3 section"]);
    });

    it("removes a tier from several with a right click", () => {
      rightClick(button("Tier 2"));
      rightClick(button("Tier 3"));
      rightClick(button("Tier 2"));
      expect([pressed("Tier 2"), pressed("Tier 3")]).toEqual([false, true]);
    });

    it("goes back to one tier on a left click", () => {
      rightClick(button("Tier 2"));
      rightClick(button("Tier 3"));
      click(button("Tier 4"));
      expect([pressed("Tier 2"), pressed("Tier 3"), pressed("Tier 4")]).toEqual([false, false, true]);
    });

    it("selects several tags, Super included, with right clicks", () => {
      rightClick(button("Hurt"));
      rightClick(button("Summon"));
      rightClick(button("Super"));
      expect([pressed("Hurt"), pressed("Summon"), pressed("Super")]).toEqual([true, true, true]);
    });

    it("goes back to one tag on a left click", () => {
      rightClick(button("Hurt"));
      rightClick(button("Super"));
      click(button("Summon"));
      expect([pressed("Hurt"), pressed("Super"), pressed("Summon")]).toEqual([false, false, true]);
    });

    it("shows Turtle and Custom first, then the other packs alphabetically", () => {
      const icons = [...container.querySelectorAll('[role="group"][aria-label="Packs"] button')];
      expect(icons.map((icon) => icon.getAttribute("aria-label"))).toEqual([
        "Turtle pack",
        "Custom pack",
        "Bee pack",
        "Bell pack",
        "Cheetah pack",
        "Invasive pack",
        "King pack",
        "Leaf pack",
        "Roomba pack",
        "Shift pack",
      ]);
    });

    it("shows only a pack's pets when its icon is selected", () => {
      click(button("Turtle pack"));
      expect([itemNames().includes("Ant"), itemNames().includes("Chinchilla")]).toEqual([true, false]);
    });

    it("selects the main pack from a tier's packs", () => {
      click(section(1)!.querySelector<HTMLButtonElement>('[aria-label="Tier 1 packs"] button[aria-label="Custom pack"]')!);
      expect(pressed("Custom pack")).toBe(true);
    });

    it("selects several packs with right clicks", () => {
      rightClick(button("Turtle pack"));
      rightClick(button("Custom pack"));
      expect([pressed("Turtle pack"), pressed("Custom pack")]).toEqual([true, true]);
    });
  });

  describe("settings", () => {
    it("renames the pack", () => {
      openSetting("Change name");
      typeInto(settingsInput("Pack name"), "Zoo");
      expect(container.querySelector('[aria-label="Pack name"]:not(input)')!.textContent).toBe("Zoo");
    });

    it("changes the pack icon", () => {
      openSetting("Change name");
      const select = settingsModal()!.querySelector<HTMLSelectElement>('[aria-label="Pack icon"]')!;
      act(() => {
        select.value = String(PET_REGISTRY["Turtle"].id);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(container.querySelector('img[alt="Turtle"]:not(section img)')).not.toBeNull();
    });

    it("narrows the icon list by name", () => {
      openSetting("Change name");
      typeInto(settingsInput("Search icons"), "fish");
      const options = [...settingsModal()!.querySelectorAll('[aria-label="Pack icon"] option')];
      expect(options.map((option) => option.textContent)).toEqual(["Ant", "Fish", "Blowfish", "Goldfish", "Lionfish"]);
    });

    it("randomizes every tier to 10 pets and 3 foods", () => {
      openSetting("Randomize");
      const fullTiers = [1, 2, 3, 4, 5, 6].filter(
        (tier) => countLabel(tier, "Pets 10 / 10") && countLabel(tier, "Foods 3 / 3")
      );
      expect(fullTiers).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("keeps the name when randomizing", () => {
      openSetting("Randomize");
      expect(container.querySelector('[aria-label="Pack name"]:not(input)')!.textContent).toBe("My Pack");
    });

    it("clears every pet and food", () => {
      openSetting("Randomize");
      openSetting("Clear");
      expect(itemNames().filter((name) => pressed(name))).toEqual([]);
    });

    it("imports the code it exported", () => {
      click(button("Ant"));
      click(button("Apple"));
      openSetting("Export");
      const code = settingsInput("Pack code").value;
      click(settingsModal()!.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!);
      click(button("Ant"));
      click(button("Beaver"));
      importCode(code);
      expect([pressed("Ant"), pressed("Apple"), pressed("Beaver")]).toEqual([true, true, false]);
    });

    it("closes the settings after an import", () => {
      importCode(JSON.stringify({ Title: "Zoo", Minion: 1, Minions: [1], Spells: [] }));
      expect(settingsModal()).toBeNull();
    });

    it("loads a code with 11 pets in a tier", () => {
      importCode(JSON.stringify({ Title: "Big", Minion: 1, Minions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 69], Spells: [] }));
      expect(countLabel(1, "Pets 11 / 10")).toBeDefined();
    });

    it("shows why a code can't be imported", () => {
      openSetting("Import");
      typeInto(settingsInput("Pack code"), "not a code");
      click(settingsButton("Import"));
      expect(settingsModal()!.querySelector('[role="alert"]')!.textContent).toBe("Not a pack code");
    });
  });
});
