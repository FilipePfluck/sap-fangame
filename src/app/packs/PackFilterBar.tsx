"use client";

import Image from "next/image";
import type { MouseEvent, ReactNode } from "react";
import { ALL_TAGS, SUPER_TAG_DISPLAY, TAG_DISPLAY, type TagDisplay } from "@/lib/tags";
import {
  ALL_PACK_SOURCES,
  PACK_SOURCE_NAMES,
  PACK_SOURCE_SPRITES,
  type PackFilter,
  type PackSource,
} from "@/lib/game/pack";
import type { Tag } from "@/lib/types";
import Tooltip from "@/app/arena/[gameId]/Tooltip";
import { BUTTON_CLASS, toggleButtonClass } from "./styles";

// Index 0 is tier 1.
export const TIER_DICE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const;


// Left click selects only `item`, or clears it if it's already the only one.
// Right click (`addToSelection`) adds or removes it, keeping the rest.
function select<T>(selected: readonly T[], item: T, addToSelection: boolean): T[] {
  if (addToSelection) return selected.includes(item) ? selected.filter((other) => other !== item) : [...selected, item];
  return selected.length === 1 && selected[0] === item ? [] : [item];
}

export function selectTier(filter: PackFilter, tier: number, addToSelection: boolean): PackFilter {
  return { ...filter, tiers: select(filter.tiers, tier, addToSelection) };
}

// Like searching `pack:turtle`.
export function selectPackSource(filter: PackFilter, source: PackSource, addToSelection: boolean): PackFilter {
  return { ...filter, packSources: select(filter.packSources, source, addToSelection) };
}

// Super counts as one of the tags: a left click on either clears the other.
export function selectTag(filter: PackFilter, tag: Tag, addToSelection: boolean): PackFilter {
  if (addToSelection) return { ...filter, tags: select(filter.tags, tag, true) };
  const onlyThisTag = !filter.superTag && filter.tags.length === 1 && filter.tags[0] === tag;
  return { ...filter, tags: onlyThisTag ? [] : [tag], superTag: false };
}

export function selectSuperTag(filter: PackFilter, addToSelection: boolean): PackFilter {
  if (addToSelection) return { ...filter, superTag: !filter.superTag };
  const onlySuper = filter.superTag && filter.tags.length === 0;
  return { ...filter, tags: [], superTag: !onlySuper };
}

// Handlers for a die or tag button: left click selects one, right click several.
export function selectionHandlers(onSelect: (addToSelection: boolean) => void) {
  return {
    onClick: () => onSelect(false),
    onContextMenu: (event: MouseEvent) => {
      event.preventDefault();
      onSelect(true);
    },
  };
}

type TagButtonProps = {
  tag: TagDisplay;
  selected: boolean;
  onSelect: (addToSelection: boolean) => void;
};

function TagButton({ tag, selected, onSelect }: TagButtonProps) {
  return (
    // The tooltip wrapper takes the button's share of the row.
    <Tooltip text={tag.label} className="relative flex-1 min-w-0">
      <button
        {...selectionHandlers(onSelect)}
        aria-label={tag.label}
        aria-pressed={selected}
        className={`w-full p-0.5 ${toggleButtonClass(selected)}`}
      >
        <div className="relative w-full aspect-square">
          <Image src={tag.sprite} alt={tag.label} fill sizes="32px" className="object-contain" />
        </div>
      </button>
    </Tooltip>
  );
}

type SearchBarProps = {
  search: string;
  onSearchChange: (search: string) => void;
};

function SearchBar({ search, onSearchChange }: SearchBarProps) {
  return (
    <div className={`flex flex-1 min-w-48 items-center gap-2 px-3 py-1 ${BUTTON_CLASS}`}>
      <span aria-hidden>🔍</span>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search..."
        aria-label="Search"
        className="flex-1 bg-transparent outline-none"
      />
      {search && (
        <button onClick={() => onSearchChange("")} aria-label="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}

type PackFilterBarProps = {
  filter: PackFilter;
  onFilterChange: (filter: PackFilter) => void;
  // Extra buttons after the search bar.
  children?: ReactNode;
};

type PackSourceButtonProps = {
  source: PackSource;
  selected: boolean;
  onSelect: (addToSelection: boolean) => void;
  // The small version in each tier's heading.
  mini?: boolean;
};

export function PackSourceButton({ source, selected, onSelect, mini = false }: PackSourceButtonProps) {
  const name = PACK_SOURCE_NAMES[source];
  const iconSize = mini ? 16 : 28;
  return (
    <Tooltip text={name}>
      <button
        {...selectionHandlers(onSelect)}
        aria-label={`${name} pack`}
        aria-pressed={selected}
        className={`flex items-center justify-center p-0.5 ${toggleButtonClass(selected)}`}
      >
        <Image src={PACK_SOURCE_SPRITES[source]} alt={name} width={iconSize} height={iconSize} />
      </button>
    </Tooltip>
  );
}

// The tier dice, search bar, pack icons and tag row.
export default function PackFilterBar({ filter, onFilterChange, children }: PackFilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {TIER_DICE.map((die, index) => {
          const tier = index + 1;
          const selected = filter.tiers.includes(tier);
          return (
            <button
              key={tier}
              {...selectionHandlers((addToSelection) => onFilterChange(selectTier(filter, tier, addToSelection)))}
              aria-label={`Tier ${tier}`}
              aria-pressed={selected}
              className={`px-2 py-1 text-2xl leading-none ${toggleButtonClass(selected)}`}
            >
              {die}
            </button>
          );
        })}
        <SearchBar search={filter.query} onSearchChange={(query) => onFilterChange({ ...filter, query })} />
        {children}
      </div>

      <div role="group" aria-label="Packs" className="flex flex-wrap gap-1">
        {ALL_PACK_SOURCES.map((source) => (
          <PackSourceButton
            key={source}
            source={source}
            selected={filter.packSources.includes(source)}
            onSelect={(addToSelection) => onFilterChange(selectPackSource(filter, source, addToSelection))}
          />
        ))}
      </div>

      {/* One row: each tag shrinks to share the width. */}
      <div role="group" aria-label="Tags" className="flex gap-1">
        {ALL_TAGS.map((tag) => (
          <TagButton
            key={tag}
            tag={TAG_DISPLAY[tag]}
            selected={filter.tags.includes(tag)}
            onSelect={(addToSelection) => onFilterChange(selectTag(filter, tag, addToSelection))}
          />
        ))}
        <TagButton
          tag={SUPER_TAG_DISPLAY}
          selected={filter.superTag}
          onSelect={(addToSelection) => onFilterChange(selectSuperTag(filter, addToSelection))}
        />
      </div>
    </div>
  );
}
