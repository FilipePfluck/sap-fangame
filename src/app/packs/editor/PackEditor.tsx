"use client";

import { useState } from "react";
import Image from "next/image";
import { ALL_TAGS, SUPER_TAG_DISPLAY, TAG_DISPLAY, type TagDisplay } from "@/lib/tags";
import PackViewer from "@/app/arena/[gameId]/PackViewer";
import { BUTTON_CLASS, toggleButtonClass } from "../styles";

// Index 0 is tier 1.
const TIER_DICE = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"] as const;

// The archetypes, then Super.
const TAG_BUTTONS: readonly TagDisplay[] = [...ALL_TAGS.map((tag) => TAG_DISPLAY[tag]), SUPER_TAG_DISPLAY];

// Not functional yet.
const SETTINGS_BUTTONS = ["Change name", "Randomize", "Export", "Import", "Discard changes", "Delete"] as const;

// Selects `item`, or clears the selection if `item` is already selected.
function toggleSelection<T>(selected: T | null, item: T): T | null {
  return selected === item ? null : item;
}

type TagButtonProps = {
  tag: TagDisplay;
  selected: boolean;
  onToggle: () => void;
};

function TagButton({ tag, selected, onToggle }: TagButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={tag.label}
      aria-pressed={selected}
      title={tag.label}
      className={`flex-1 min-w-0 p-0.5 ${toggleButtonClass(selected)}`}
    >
      <div className="relative w-full aspect-square">
        <Image src={tag.sprite} alt={tag.label} fill sizes="32px" className="object-contain" />
      </div>
    </button>
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

function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pack settings"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-4">
        <div className="flex justify-end">
          <button onClick={onClose} aria-label="Close" className="font-bold leading-none text-zinc-600 dark:text-zinc-400">
            ✕
          </button>
        </div>
        {SETTINGS_BUTTONS.map((label) => (
          <button key={label} disabled className={`px-4 py-2 text-left disabled:opacity-60 ${BUTTON_CLASS}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PackEditor() {
  // One tier and one tag can be selected together, but never two of either.
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<TagDisplay | null>(null);
  const [search, setSearch] = useState("");
  const [packViewerOpen, setPackViewerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {TIER_DICE.map((die, index) => {
          const tier = index + 1;
          return (
            <button
              key={tier}
              onClick={() => setSelectedTier((selected) => toggleSelection(selected, tier))}
              aria-label={`Tier ${tier}`}
              aria-pressed={selectedTier === tier}
              className={`px-2 py-1 text-2xl leading-none ${toggleButtonClass(selectedTier === tier)}`}
            >
              {die}
            </button>
          );
        })}
        <SearchBar search={search} onSearchChange={setSearch} />
        <button onClick={() => setPackViewerOpen(true)} aria-label="View pack" className={`px-3 py-1 ${BUTTON_CLASS}`}>
          🔍
        </button>
        <button onClick={() => setSettingsOpen(true)} aria-label="Open pack settings" className={`px-3 py-1 ${BUTTON_CLASS}`}>
          🔧
        </button>
      </div>

      {/* One row: each tag shrinks to share the width. */}
      <div className="flex gap-1">
        {TAG_BUTTONS.map((tag) => (
          <TagButton
            key={tag.label}
            tag={tag}
            selected={selectedTag === tag}
            onToggle={() => setSelectedTag((selected) => toggleSelection(selected, tag))}
          />
        ))}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {packViewerOpen && <PackViewer onClose={() => setPackViewerOpen(false)} />}
    </div>
  );
}
