import { describe, it, expect } from "vitest";
import { TOKEN_PETS } from "@/lib/pets";
import { TOKEN_FOODS } from "@/lib/foods";

const names = (items: readonly { name: string }[]) => new Set(items.map((item) => item.name));

describe("token lists", () => {
  it("has exactly the token pets", () => {
    expect(names(TOKEN_PETS)).toEqual(
      new Set([
        "Zombie Cricket",
        "Bee",
        "Ram",
        "Chick",
        "Bus",
        "Dirty Rat",
        "Zombie Fly",
        "Adult Flounder",
        "Loyal Chinchilla",
        "Cuckoo Chick",
        "Quail",
        "Sleeping Gelada",
      ])
    );
  });

  it("has exactly the token foods", () => {
    expect(names(TOKEN_FOODS)).toEqual(
      new Set([
        "Bread Crumbs",
        "Better Apple",
        "Best Apple",
        "Milk",
        "Better Milk",
        "Best Milk",
        "Peanut",
        "Coconut",
        "Corncob",
        "Egg",
        "Rice",
        "Melon Slice",
        "Popcorn",
        "Peanut Butter",
      ])
    );
  });
});
