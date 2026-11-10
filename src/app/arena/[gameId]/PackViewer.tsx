"use client";

import Image from "next/image";
import { useState } from "react";
import { TURTLE_PACK, getPackTierRows, getTooltipPages, type TooltipEntry } from "@/lib/game/pack";
import Tooltip from "./Tooltip";

type PackSpriteProps = {
  entry: TooltipEntry;
};

function PackSprite({ entry }: PackSpriteProps) {
  return (
    <Tooltip pages={getTooltipPages(entry)}>
      <div className="relative w-12 h-12">
        <Image src={entry.sprite} alt={entry.name} fill sizes="48px" className="object-contain" />
      </div>
    </Tooltip>
  );
}

type PackViewerProps = {
  onClose: () => void;
};

export default function PackViewer({ onClose }: PackViewerProps) {
  const [customExclusive, setCustomExclusive] = useState(false);
  const rows = customExclusive
    ? getPackTierRows(TURTLE_PACK.customPets, TURTLE_PACK.customFoods)
    : getPackTierRows(TURTLE_PACK.pets, TURTLE_PACK.foods);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pack viewer"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-5xl max-h-full overflow-y-auto rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={customExclusive}
              onChange={(event) => setCustomExclusive(event.target.checked)}
            />
            Custom exclusive
          </label>
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-bold leading-none text-zinc-600 dark:text-zinc-400"
          >
            ✕
          </button>
        </div>
        {rows.map(({ tier, unlockTurn, pets, foods }) => (
          <div
            key={tier}
            className="flex items-start gap-4 py-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
          >
            <span className="w-16 shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Turn {unlockTurn}
            </span>
            <div className="flex flex-1 min-w-0 flex-wrap gap-2">
              {pets.map((pet) => (
                <PackSprite key={pet.name} entry={pet} />
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {foods.map((food) => (
                <PackSprite key={food.name} entry={food} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
