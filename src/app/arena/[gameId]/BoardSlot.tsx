"use client";

import Image from "next/image";
import type { PetInstance } from "@/lib/types";

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
        "w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all overflow-hidden",
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
          <div className="relative w-10 h-10">
            <Image src={sprite} alt={pet.type} fill className="object-contain" />
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {pet.attack}/{pet.health}
          </span>
          {pet.perk && <span className="text-xs text-purple-500">{pet.perk}</span>}
        </>
      ) : (
        <span className="text-zinc-300 dark:text-zinc-600 text-lg">+</span>
      )}
    </button>
  );
}
