"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import { RestrictToElement } from "@dnd-kit/dom/modifiers";
import { StaticPack, getTooltipPages, type Pack, type TooltipEntry } from "@/lib/game/pack";
import type { PackTier } from "@/lib/types";
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

type SortablePackSpriteProps = {
  entry: TooltipEntry;
  // Unique among every sprite in the viewer: pets and foods can share an ID.
  sortableId: string;
  index: number;
  // A tier's pets or foods. Sprites only accept their own group, so nothing
  // moves to another tier or between pets and foods.
  group: string;
};

// Keeps a dragged sprite on its own row.
const SORTABLE_MODIFIERS = [
  RestrictToHorizontalAxis,
  RestrictToElement.configure({
    element: (operation) => operation.source?.element?.closest("[data-sortable-row]") ?? null,
  }),
];

function SortablePackSprite({ entry, sortableId, index, group }: SortablePackSpriteProps) {
  const { ref } = useSortable({
    id: sortableId,
    index,
    group,
    type: group,
    accept: group,
    modifiers: SORTABLE_MODIFIERS,
  });
  // dnd-kit moves this element among its siblings, so it must be the row's
  // direct child, not the sprite inside the tooltip.
  return (
    <div ref={ref} aria-label={entry.name} className="cursor-grab">
      <PackSprite entry={entry} />
    </div>
  );
}

// Fetches the pack's sprites into the browser cache when the page loads, so
// they don't pop in one by one when the viewer opens.
export function usePreloadPackSprites(pack: Pack) {
  useEffect(() => {
    for (const sprite of pack.getSprites()) new window.Image().src = sprite;
  }, [pack]);
}

const petGroup = (tierIndex: number) => `pets:${tierIndex}`;
const foodGroup = (tierIndex: number) => `foods:${tierIndex}`;

type PackViewerProps = {
  pack: Pack;
  onClose: () => void;
  // Set by the pack editor only: dragging a pet or food within its tier moves
  // it to `targetId`'s place, which changes the pack's order.
  onMovePet?: (movedId: number, targetId: number) => void;
  onMoveFood?: (movedId: number, targetId: number) => void;
};

export default function PackViewer({ pack, onClose, onMovePet, onMoveFood }: PackViewerProps) {
  const [customExclusive, setCustomExclusive] = useState(false);
  // Only static packs have custom pets and foods to swap to.
  const customTier = pack instanceof StaticPack ? pack.customTier : null;
  const tiers = customExclusive && customTier ? customTier : pack.data.tier;

  const rows = <TierRows tiers={tiers} sortable={onMovePet !== undefined && onMoveFood !== undefined} />;


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
        {onMovePet && onMoveFood ? (
          <DragDropProvider
            onDragEnd={(event) => {
              const { source } = event.operation;
              if (event.canceled || !isSortable(source) || source.initialGroup !== source.group) return;
              const { initialIndex, index } = source;
              if (initialIndex === index) return;
              // Each tier's pets and each tier's foods are their own group.
              const sortGroups = new Map(
                tiers.flatMap(({ pets, foods }, tierIndex) => [
                  [petGroup(tierIndex), { ids: pets.map((pet) => pet.id), onMove: onMovePet }],
                  [foodGroup(tierIndex), { ids: foods.map((food) => food.id), onMove: onMoveFood }],
                ])
              );
              const { ids, onMove } = sortGroups.get(String(source.group))!;
              onMove(ids[initialIndex], ids[index]);
            }}
          >
            {rows}
          </DragDropProvider>
        ) : (
          rows
        )}
      </div>
    </div>
  );
}

type TierRowsProps = {
  tiers: readonly PackTier[];
  // Inside a DragDropProvider, so the sprites can be dragged.
  sortable: boolean;
};

function TierRows({ tiers, sortable }: TierRowsProps) {
  function renderSprite(entry: TooltipEntry, sortableId: string, index: number, group: string) {
    return sortable ? (
      <SortablePackSprite key={sortableId} entry={entry} sortableId={sortableId} index={index} group={group} />
    ) : (
      <PackSprite key={sortableId} entry={entry} />
    );
  }

  return tiers.map(({ pets, foods }, tierIndex) => (
    <div
      key={tierIndex}
      className="flex items-start gap-4 py-3 border-b border-zinc-200 dark:border-zinc-700 last:border-b-0"
    >
      <span className="w-16 shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Tier {tierIndex + 1}
      </span>
      {/* Sortable rows stay on one line, so dragging never wraps them. */}
      <div data-sortable-row className={`flex flex-1 min-w-0 gap-2 ${sortable ? "overflow-x-auto" : "flex-wrap"}`}>
        {pets.map((pet, index) => renderSprite(PET_BY_ID[pet.id], `pet:${pet.id}`, index, petGroup(tierIndex)))}
      </div>
      <div data-sortable-row className={`flex justify-end gap-2 ${sortable ? "" : "flex-wrap"}`}>
        {foods.map((food, index) => renderSprite(food, `food:${food.id}`, index, foodGroup(tierIndex)))}
      </div>
    </div>
  ));
}
