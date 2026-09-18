"use client";

import Image from "next/image";
import type { PetInstance } from "@/lib/types";
import { computeLevel } from "@/lib/game/merge";
import { FOOD_SPRITES } from "@/lib/sprites";
import { PET_REGISTRY, getPetDescription } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import Tooltip from "./Tooltip";

type BoardSlotProps = {
  pet: PetInstance | null;
  sprite: string | null;
  isSelected: boolean;
  isTargetable: boolean;
  onClick: () => void;
};

export default function BoardSlot({ pet, sprite, isSelected, isTargetable, onClick }: BoardSlotProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "relative w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all",
        isSelected
          ? "border-green-400 ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20 cursor-pointer"
          : pet
          ? "border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800 cursor-pointer hover:border-zinc-500"
          : isTargetable
          ? "border-dashed border-amber-400 bg-amber-50 dark:bg-amber-900/10 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20"
          : "border-dashed border-zinc-300 dark:border-zinc-600 bg-transparent cursor-default",
      ].join(" ")}
    >
      {pet && sprite ? (
        <>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            Lv{computeLevel(pet.xp)} · {pet.xp}xp
          </span>
          <Tooltip
            text={
              PET_REGISTRY[pet.type] &&
              getPetDescription(PET_REGISTRY[pet.type], computeLevel(pet.xp))
            }
          >
            <div className="relative w-10 h-10">
              <Image src={sprite} alt={pet.type} fill className="object-contain" />
            </div>
          </Tooltip>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {pet.attack}/{pet.health}
          </span>
          {pet.perk && FOOD_SPRITES[pet.perk] && (
            <Tooltip
              text={FOOD_REGISTRY[pet.perk]?.description}
              className="absolute top-1 right-1 w-4 h-4"
            >
              <Image src={FOOD_SPRITES[pet.perk]} alt={pet.perk} fill className="object-contain" />
            </Tooltip>
          )}
        </>
      ) : (
        <span className="text-zinc-300 dark:text-zinc-600 text-lg">+</span>
      )}
    </button>
  );
}
