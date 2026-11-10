"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { StaticPack, getTooltipPages, type Pack, type TooltipEntry } from "@/lib/game/pack";
import { getTierUnlockTurn } from "@/lib/game/shop";
import { PET_BY_ID } from "@/lib/pets";
import Tooltip from "./Tooltip";

type PackSpriteProps = {
  entry: TooltipEntry;
};

function PackSprite({ entry }: PackSpriteProps) {
  return (
    <Tooltip pages={getTooltipPages(entry)}>
      <div className="relative w-12 h-12">
        {/* Unoptimized, so the URL matches the one usePreloadPackSprites fetched. */}
        <Image src={entry.sprite} alt={entry.name} fill sizes="48px" unoptimized className="object-contain" />
      </div>
    </Tooltip>
  );
}

// Fetches the pack's sprites into the browser cache when the page loads, so
// they don't pop in one by one when the viewer opens.
export function usePreloadPackSprites(pack: Pack) {
  useEffect(() => {
    for (const sprite of pack.getSprites()) new window.Image().src = sprite;
  }, [pack]);
}

type PackViewerProps = {
  pack: Pack;
  onClose: () => void;
};

export default function PackViewer({ pack, onClose }: PackViewerProps) {
  const [customExclusive, setCustomExclusive] = useState(false);
  // Only static packs have custom pets and foods to swap to.
  const customTier = pack instanceof StaticPack ? pack.customTier : null;
  const tiers = customExclusive && customTier ? customTier : pack.data.tier;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pack viewer"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-5xl max-h-full overflow-y-auto rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-end">
          {customTier && (
            <label className="mr-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={customExclusive}
                onChange={(event) => setCustomExclusive(event.target.checked)}
              />
              Custom exclusive
            </label>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="font-bold leading-none text-zinc-600 dark:text-zinc-400"
          >
            ✕
          </button>
        </div>
        {tiers.map(({ pets, foods }, index) => (
          <div
            key={index}
            className="flex items-start gap-4 py-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
          >
            <span className="w-16 shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Turn {getTierUnlockTurn(index + 1)}
            </span>
            <div className="flex flex-1 min-w-0 flex-wrap gap-2">
              {pets.map((pet) => (
                <PackSprite key={pet.id} entry={PET_BY_ID[pet.id]} />
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {foods.map((food) => (
                <PackSprite key={food.id} entry={food} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
