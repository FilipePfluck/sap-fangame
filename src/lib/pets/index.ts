import type { StaticPet } from "@/lib/types";
import { Sloth } from "./turtle/token/sloth";
import { Duck } from "./turtle/tier 1/duck";
import { Beaver } from "./turtle/tier 1/beaver";
import { Pigeon } from "./turtle/tier 1/pigeon";
import { Otter } from "./turtle/tier 1/otter";
import { Pig } from "./turtle/tier 1/pig";
import { Ant } from "./turtle/tier 1/ant";
import { Mosquito } from "./turtle/tier 1/mosquito";
import { Fish } from "./turtle/tier 1/fish";
import { Cricket } from "./turtle/tier 1/cricket";
import { Horse } from "./turtle/tier 1/horse";
import { Bus } from "./turtle/tier 1/bus";
import { DirtyRat } from "./turtle/tier 1/dirty-rat";
import { ZombieFly } from "./turtle/tier 1/zombie-fly";
import { ZombieCricket } from "./turtle/token/zombie-cricket";
import { Bee } from "./turtle/token/bee";
import { Snail } from "./turtle/tier 2/snail";
import { Crab } from "./turtle/tier 2/crab";
import { Swan } from "./turtle/tier 2/swan";
import { Peacock } from "./turtle/tier 2/peacock";
import { Kangaroo } from "./turtle/tier 2/kangaroo";
import { Hedgehog } from "./turtle/tier 2/hedgehog";
import { Flamingo } from "./turtle/tier 2/flamingo";
import { Rat } from "./turtle/tier 2/rat";
import { Spider } from "./turtle/tier 2/spider";
import { Worm } from "./turtle/tier 2/worm";
import { Dodo } from "./turtle/tier 3/dodo";
import { Ox } from "./turtle/tier 3/ox";
import { Badger } from "./turtle/tier 3/badger";
import { Dolphin } from "./turtle/tier 3/dolphin";
import { Elephant } from "./turtle/tier 3/elephant";
import { Rabbit } from "./turtle/tier 3/rabbit";
import { Giraffe } from "./turtle/tier 3/giraffe";
import { Camel } from "./turtle/tier 3/camel";
import { Dog } from "./turtle/tier 3/dog";
import { Sheep } from "./turtle/tier 3/sheep";
import { Ram } from "./turtle/token/ram";
import { Skunk } from "./turtle/tier 4/skunk";
import { Hippo } from "./turtle/tier 4/hippo";
import { Bison } from "./turtle/tier 4/bison";
import { Squirrel } from "./turtle/tier 4/squirrel";
import { Penguin } from "./turtle/tier 4/penguin";
import { Blowfish } from "./turtle/tier 4/blowfish";
import { Turtle } from "./turtle/tier 4/turtle";
import { Deer } from "./turtle/tier 4/deer";
import { Whale } from "./turtle/tier 4/whale";
import { Scorpion } from "./turtle/tier 5/scorpion";
import { Crocodile } from "./turtle/tier 5/crocodile";
import { Rhino } from "./turtle/tier 5/rhino";
import { Armadillo } from "./turtle/tier 5/armadillo";
import { Turkey } from "./turtle/tier 5/turkey";
import { Monkey } from "./turtle/tier 5/monkey";
import { Seal } from "./turtle/tier 5/seal";
import { Rooster } from "./turtle/tier 5/rooster";
import { Chick } from "./turtle/token/chick";
import { Cow } from "./turtle/tier 5/cow";
import { Leopard } from "./turtle/tier 6/leopard";
import { Boar } from "./turtle/tier 6/boar";
import { Tiger } from "./turtle/tier 6/tiger";
import { Dragon } from "./turtle/tier 6/dragon";
import { Mammoth } from "./turtle/tier 6/mammoth";
import { Snake } from "./turtle/tier 6/snake";
import { Fly } from "./turtle/tier 6/fly";
import { Gorilla } from "./turtle/tier 6/gorilla";
import { Wolverine } from "./turtle/tier 6/wolverine";
import { Alpaca } from "./SAPOther/tier 6/alpaca";
import { Jerboa } from "./SAPOther/tier 4/jerboa";
import { Seagull } from "./SAPOther/tier 4/seagull";

export {
  Sloth,
  Duck,
  Beaver,
  Pigeon,
  Otter,
  Pig,
  Ant,
  Mosquito,
  Fish,
  Cricket,
  Horse,
  Bus,
  DirtyRat,
  ZombieFly,
  ZombieCricket,
  Bee,
  Snail,
  Crab,
  Swan,
  Peacock,
  Kangaroo,
  Hedgehog,
  Flamingo,
  Rat,
  Spider,
  Worm,
  Dodo,
  Ox,
  Badger,
  Dolphin,
  Elephant,
  Rabbit,
  Giraffe,
  Camel,
  Dog,
  Sheep,
  Ram,
  Skunk,
  Hippo,
  Bison,
  Squirrel,
  Penguin,
  Blowfish,
  Turtle,
  Deer,
  Whale,
  Scorpion,
  Crocodile,
  Rhino,
  Armadillo,
  Turkey,
  Monkey,
  Seal,
  Rooster,
  Chick,
  Cow,
  Leopard,
  Boar,
  Tiger,
  Dragon,
  Mammoth,
  Snake,
  Fly,
  Gorilla,
  Wolverine,
  Alpaca,
  Jerboa,
  Seagull,
};

export const TURTLE_PACK_PETS: StaticPet[] = [
  Duck,
  Beaver,
  Pigeon,
  Otter,
  Pig,
  Ant,
  Mosquito,
  Fish,
  Cricket,
  Horse,
  Bus,
  DirtyRat,
  ZombieFly,
  ZombieCricket,
  Bee,
  Snail,
  Crab,
  Swan,
  Peacock,
  Kangaroo,
  Hedgehog,
  Flamingo,
  Rat,
  Spider,
  Worm,
  Dodo,
  Ox,
  Badger,
  Dolphin,
  Elephant,
  Rabbit,
  Giraffe,
  Camel,
  Dog,
  Sheep,
  Ram,
  Skunk,
  Hippo,
  Bison,
  Squirrel,
  Penguin,
  Blowfish,
  Turtle,
  Deer,
  Whale,
  Scorpion,
  Crocodile,
  Rhino,
  Armadillo,
  Turkey,
  Monkey,
  Seal,
  Rooster,
  Chick,
  Cow,
  Leopard,
  Boar,
  Tiger,
  Dragon,
  Mammoth,
  Snake,
  Fly,
  Gorilla,
  Wolverine,
];

export const SAP_OTHER_PACK_PETS: StaticPet[] = [
  Alpaca,
  Jerboa,
  Seagull,
];

export const PET_REGISTRY: Record<string, StaticPet> = Object.fromEntries([
  ...TURTLE_PACK_PETS.map((pet) => [pet.name, pet]),
  ...SAP_OTHER_PACK_PETS.map((pet) => [pet.name, pet]),
  [Sloth.name, Sloth],
]);

export const SHOP_PET_POOL: StaticPet[] = [
  ...TURTLE_PACK_PETS,
  ...SAP_OTHER_PACK_PETS,
].filter((pet) => !pet.isToken);

function stripTooltipNotes(text: string): string {
  return text
    .replace(/\s*\(\s*(?:Level up reward|Level-up reward|Note|Notes)\s*[:\-]?[\s\S]*?\)\s*/gi, " ")
    .replace(/\s*(?:\r?\n)\s*(?:Note|Notes)\s*:\s*[\s\S]*$/gi, "")
    .replace(/\s*(?:\r?\n)\s*(?:Note|Notes)\s*[-:]\s*[\s\S]*$/gi, "")
    .replace(/\s*(?:\r?\n)\s*(?:Similar targeting to|Like|Equivalent to|Comparable to)\s+[\s\S]*$/gi, "")
    .replace(/\s*\b(?:Similar targeting to|Like|Equivalent to|Comparable to)\s+[A-Z][\w\s-]*\.?\s*$/gi, "")
    .trim();
}

export function getPetDescription(pet: StaticPet | undefined, level: number): string | undefined {
  if (!pet) return undefined;
  const description = typeof pet.description === "function" ? pet.description(level) : pet.description;
  return description ? stripTooltipNotes(description) : undefined;
}

export function getShopPetTooltipText(pet: StaticPet | undefined, level: number): string {
  return getPetDescription(pet, level) ?? "";
}
