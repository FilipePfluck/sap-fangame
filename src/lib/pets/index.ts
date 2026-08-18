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
];

export const PET_REGISTRY: Record<string, PetType> = Object.fromEntries(
  TURTLE_PACK_PETS.map((p) => [p.name, p])
);

export const SHOP_PET_POOL: PetType[] = TURTLE_PACK_PETS.filter(
  (p) => !p.isToken
);
