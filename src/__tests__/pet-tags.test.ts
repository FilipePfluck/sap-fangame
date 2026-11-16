import { describe, it, expect } from "vitest";
import { PET_REGISTRY } from "@/lib/pets";
import { MAX_SUPER_TAGS_PER_PET, MAX_TAGS_PER_PET } from "@/lib/game/rules";
import { ALL_TAGS } from "@/lib/tags";

const pets = Object.values(PET_REGISTRY);

// Tags spec: up to 3 tags per pet; archetypes at most once, Super may repeat.
describe("pet tags", () => {
  it.each(pets)("$name has no repeated archetype", ({ tags }) => {
    expect(new Set(tags).size).toBe(tags.length);
  });

  it.each(pets)("$name has at most 3 tags including Super", ({ tags, superTags }) => {
    expect(tags.length + superTags).toBeLessThanOrEqual(MAX_TAGS_PER_PET);
  });

  it.each(pets)("$name has at most 3 Super tags", ({ superTags }) => {
    expect(superTags).toBeLessThanOrEqual(MAX_SUPER_TAGS_PER_PET);
  });

  it.each(pets)("$name lists its tags in pack editor order", ({ tags }) => {
    const editorOrder = [...tags].sort((a, b) => ALL_TAGS.indexOf(a) - ALL_TAGS.indexOf(b));
    expect(tags).toEqual(editorOrder);
  });
});
