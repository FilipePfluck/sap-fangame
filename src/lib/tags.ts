import { Tag } from "@/lib/types";

// Numeric enums also map names back to values; keep only the values.
export const ALL_TAGS: readonly Tag[] = Object.values(Tag).filter((tag): tag is Tag => typeof tag === "number");

export type TagDisplay = Readonly<{ label: string; sprite: string }>;

export const TAG_DISPLAY: Readonly<Record<Tag, TagDisplay>> = {
  [Tag.Ailment]: { label: "Ailment", sprite: "/sap/tag_ailment.png" },
  [Tag.Biome]: { label: "Biome", sprite: "/sap/tag_biome.png" },
  [Tag.Buff]: { label: "Buff", sprite: "/sap/tag_buff.png" },
  [Tag.Collapse]: { label: "Collapse", sprite: "/sap/tag_collapse.png" },
  [Tag.Cycle]: { label: "Cycle", sprite: "/sap/tag_cycle.png" },
  [Tag.Disruption]: { label: "Disruption", sprite: "/sap/tag_disruption.png" },
  [Tag.Food]: { label: "Food", sprite: "/sap/tag_food.png" },
  [Tag.Gold]: { label: "Gold", sprite: "/sap/tag_gold.png" },
  [Tag.Guard]: { label: "Guard", sprite: "/sap/tag_guard.png" },
  [Tag.Honey]: { label: "Honey", sprite: "/sap/tag_honey.png" },
  [Tag.Hurt]: { label: "Hurt", sprite: "/sap/tag_hurt.png" },
  [Tag.Leavings]: { label: "Leavings", sprite: "/sap/tag_leavings.png" },
  [Tag.LevelUp]: { label: "Level-Up", sprite: "/sap/tag_levelup.png" },
  [Tag.Perk]: { label: "Perk", sprite: "/sap/tag_perk.png" },
  [Tag.Rings]: { label: "Rings", sprite: "/sap/tag_rings.png" },
  [Tag.Roll]: { label: "Roll", sprite: "/sap/tag_roll.png" },
  [Tag.Shield]: { label: "Shield", sprite: "/sap/tag_shield.png" },
  [Tag.Shift]: { label: "Shift", sprite: "/sap/tag_shift.png" },
  [Tag.Summon]: { label: "Summon", sprite: "/sap/tag_summon.png" },
  [Tag.Toy]: { label: "Toy", sprite: "/sap/tag_toy.png" },
  [Tag.Transform]: { label: "Transform", sprite: "/sap/tag_transform.png" },
};

export const SUPER_TAG_DISPLAY: TagDisplay = { label: "Super", sprite: "/sap/tag_super.png" };
