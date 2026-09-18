export { Sloth } from "./sloth";
export { Duck } from "./duck";
export { Beaver } from "./beaver";
export { Pigeon } from "./pigeon";
export { Otter } from "./otter";
export { Pig } from "./pig";
export { Ant } from "./ant";
export { Mosquito } from "./mosquito";
export { Fish } from "./fish";
export { Cricket } from "./cricket";
export { Horse } from "./horse";
export { ZombieCricket } from "./zombie-cricket";
export { Bee } from "./bee";
export { Snail } from "./snail";
export { Crab } from "./crab";
export { Swan } from "./swan";
export { Dodo } from "./dodo";
export { Badger } from "./badger";
export { Dolphin } from "./dolphin";
export { Skunk } from "./skunk";
export { Hippo } from "./hippo";
export { Bison } from "./bison";
export { Scorpion } from "./scorpion";
export { Crocodile } from "./crocodile";
export { Rhino } from "./rhino";
export { Leopard } from "./leopard";
export { Boar } from "./boar";
export { Tiger } from "./tiger";

import { Sloth } from "./sloth";
import { Duck } from "./duck";
import { Beaver } from "./beaver";
import { Pigeon } from "./pigeon";
import { Otter } from "./otter";
import { Pig } from "./pig";
import { Ant } from "./ant";
import { Mosquito } from "./mosquito";
import { Fish } from "./fish";
import { Cricket } from "./cricket";
import { Horse } from "./horse";
import { ZombieCricket } from "./zombie-cricket";
import { Bee } from "./bee";
import { Snail } from "./snail";
import { Crab } from "./crab";
import { Swan } from "./swan";
import { Dodo } from "./dodo";
import { Badger } from "./badger";
import { Dolphin } from "./dolphin";
import { Skunk } from "./skunk";
import { Hippo } from "./hippo";
import { Bison } from "./bison";
import { Scorpion } from "./scorpion";
import { Crocodile } from "./crocodile";
import { Rhino } from "./rhino";
import { Leopard } from "./leopard";
import { Boar } from "./boar";
import { Tiger } from "./tiger";
import type { PetType } from "@/lib/types";

export const TURTLE_PACK_PETS: PetType[] = [
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
  ZombieCricket,
  Bee,
  Snail,
  Crab,
  Swan,
  Dodo,
  Badger,
  Dolphin,
  Skunk,
  Hippo,
  Bison,
  Scorpion,
  Crocodile,
  Rhino,
  Leopard,
  Boar,
  Tiger,
];

export const PET_REGISTRY: Record<string, PetType> = Object.fromEntries([
  ...TURTLE_PACK_PETS.map((p) => [p.name, p]),
  [Sloth.name, Sloth],
]);

export const SHOP_PET_POOL: PetType[] = TURTLE_PACK_PETS.filter(
  (p) => !p.isToken
);

export function getPetDescription(pet: PetType | undefined, level: number): string | undefined {
  if (!pet) return undefined;
  return typeof pet.description === "function" ? pet.description(level) : pet.description;
}
