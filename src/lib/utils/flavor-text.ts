import { PetInstance } from "@/lib/types";

export const numberToText: { [key: number]: string } = {
  1: "one",
  2: "two",
  3: "three",
}

export function petToString(pet: PetInstance): string {
  return `${pet.type} (${pet.attack}/${pet.health})`
}