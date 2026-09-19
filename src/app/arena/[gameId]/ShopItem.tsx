"use client";

import Image from "next/image";
import Tooltip from "./Tooltip";

type ShopItemProps = {
  name: string;
  sprite: string | null;
  subtitle: string;
  price: number;
  discounted?: boolean;
  description: string;
  isSelected: boolean;
  isFrozen: boolean;
  chained?: boolean;
  onSelect: () => void;
  onFreeze: () => void;
  // Set for items bought with a button instead of by picking a board pet.
  onBuy?: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

export default function ShopItem({
  name,
  sprite,
  subtitle,
  price,
  discounted = false,
  description,
  isSelected,
  isFrozen,
  chained = false,
  onSelect,
  onFreeze,
  onBuy,
  onContextMenu,
}: ShopItemProps) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <Tooltip text={description}>
        <button
          onClick={onSelect}
          onContextMenu={onContextMenu}
          className={[
            "w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center p-1 cursor-pointer select-none transition-all overflow-hidden",
            isSelected
              ? "border-amber-400 ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-900/20"
              : isFrozen
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
              : chained
              ? "border-purple-400 bg-white dark:bg-zinc-800 hover:border-purple-500"
              : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-zinc-400",
          ].join(" ")}
        >
          <div className="relative w-12 h-12">
            {sprite && <Image src={sprite} alt={name} fill className="object-contain" />}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">{subtitle}</span>
          {chained && <span className="absolute top-1 left-1 text-[10px] text-purple-500">linked</span>}
          {isFrozen && <span className="absolute top-1 right-1 text-xs text-blue-500">❄</span>}
        </button>
      </Tooltip>
      <span
        className={
          discounted
            ? "text-xs font-medium text-green-600 dark:text-green-400"
            : "text-xs text-yellow-600 dark:text-yellow-400"
        }
      >
        {price}g
      </span>
      {isSelected && (
        <div className="absolute -bottom-6 flex gap-1">
          {onBuy && (
            <button
              onClick={onBuy}
              className="text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Buy
            </button>
          )}
          <button
            onClick={onFreeze}
            className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-800/40"
          >
            {isFrozen ? "Unfreeze" : "Freeze"}
          </button>
        </div>
      )}
    </div>
  );
}
