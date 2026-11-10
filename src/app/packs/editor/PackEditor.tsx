"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ALL_TAGS, SUPER_TAG_DISPLAY, TAG_DISPLAY, type TagDisplay } from "@/lib/tags";
import { Ant, PET_BY_ID } from "@/lib/pets";
import type { FoodType, SerializedPack, StaticPet, TagOverview } from "@/lib/types";
import {
  ALL_PACK_SOURCES,
  NON_TOKEN_FOODS,
  NON_TOKEN_PETS,
  NO_PACK_FILTER,
  Pack,
  filterPack,
  getRandomPackIds,
  getTooltipPages,
  isAllowedPackName,
  isPet,
  type PackFilter,
  type TooltipEntry,
} from "@/lib/game/pack";
import {
  FOODS_PER_TIER,
  MAX_SAME_TAG_PER_TIER,
  MAX_SUPER_TAGS_PER_PACK,
  PETS_PER_TIER,
} from "@/lib/game/rules";
import PackViewer from "@/app/arena/[gameId]/PackViewer";
import Tooltip from "@/app/arena/[gameId]/Tooltip";
import PackFilterBar, {
  PackSourceButton,
  TIER_DICE,
  selectPackSource,
  selectSuperTag,
  selectTag,
  selectTier,
  selectionHandlers,
} from "../PackFilterBar";
import { BUTTON_CLASS, toggleButtonClass } from "../styles";

const NEW_PACK: SerializedPack = { name: "My Pack", icon: Ant.id, pets: [], foods: [], isValid: false };

// Moves `movedId` to where `targetId` is, shifting the IDs between them.
function moveId(ids: readonly number[], movedId: number, targetId: number): number[] {
  const movedIds = ids.filter((id) => id !== movedId);
  movedIds.splice(ids.indexOf(targetId), 0, movedId);
  return movedIds;
}

// Adds `id`, or removes it if it's already there.
function toggleId(ids: readonly number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id];
}

// Pink, like the WILD badge, for what makes the pack WILD.
function wildClass(isWildReason: boolean): string {
  return isWildReason ? "font-bold text-pink-600 dark:text-pink-400" : "";
}

// Red for what makes the pack invalid.
function invalidClass(isInvalidReason: boolean): string {
  return isInvalidReason ? "font-bold text-red-600 dark:text-red-400" : "";
}

// A pet's tags, then one Super icon per Super tag.
function getTagSprites(entry: TooltipEntry): readonly TagDisplay[] {
  if (!isPet(entry)) return [];
  return [...entry.tags.map((tag) => TAG_DISPLAY[tag]), ...Array<TagDisplay>(entry.superTags).fill(SUPER_TAG_DISPLAY)];
}

enum ItemHighlight {
  None,
  Selected,
  // In the pack and one of the reasons it's WILD.
  Wild,
  // In the pack and one of the reasons it's invalid.
  Invalid,
}

const ITEM_HIGHLIGHT_CLASSES: Readonly<Record<ItemHighlight, string>> = {
  [ItemHighlight.None]: "border-transparent",
  [ItemHighlight.Selected]: "border-green-600 bg-green-100 dark:bg-green-900",
  [ItemHighlight.Wild]: "border-pink-500 bg-pink-100 dark:bg-pink-900",
  [ItemHighlight.Invalid]: "border-red-600 bg-red-100 dark:bg-red-900",
};

type PackItemProps = {
  entry: TooltipEntry;
  selected: boolean;
  highlight: ItemHighlight;
  // Tags one more pet would push past their WILD limit.
  tagsAtLimit: ReadonlySet<TagDisplay>;
  onToggle: () => void;
};

function PackItem({ entry, selected, highlight, tagsAtLimit, onToggle }: PackItemProps) {
  return (
    // Only the first page: clicking toggles the item instead of turning pages.
    <Tooltip text={getTooltipPages(entry)[0]}>
      <div className="flex w-12 flex-col items-center">
        {/* Foods have no tags, but keep the row so items line up. */}
        <div aria-label={`${entry.name} tags`} className="flex h-4 gap-px">
          {getTagSprites(entry).map((tag, index) => (
            <Image
              key={index}
              src={tag.sprite}
              alt={tag.label}
              width={16}
              height={16}
              // Adding this pet would make the pack WILD.
              className={!selected && tagsAtLimit.has(tag) ? "opacity-30" : ""}
            />
          ))}
        </div>
        <button
          onClick={onToggle}
          aria-label={entry.name}
          aria-pressed={selected}
          className={`relative w-12 h-12 rounded-lg border-2 ${ITEM_HIGHLIGHT_CLASSES[highlight]}`}
        >
          <Image src={entry.sprite} alt={entry.name} fill sizes="48px" unoptimized className="object-contain p-0.5" />
        </button>
      </div>
    </Tooltip>
  );
}

type MiniTagButtonProps = {
  tier: number;
  tag: TagDisplay;
  count: number;
  overLimit: boolean;
  selected: boolean;
  onSelect: (addToSelection: boolean) => void;
};

// A tier's tag with its count. Faded when no pet in the tier has it.
function MiniTagButton({ tier, tag, count, overLimit, selected, onSelect }: MiniTagButtonProps) {
  return (
    <Tooltip text={`${tag.label} ${count}`}>
      <button
        {...selectionHandlers(onSelect)}
        aria-label={`Tier ${tier} ${tag.label} ${count}`}
        aria-pressed={selected}
        className={`flex items-center gap-0.5 px-0.5 text-xs ${toggleButtonClass(selected)} ${
          count === 0 ? "opacity-40" : ""
        } ${wildClass(overLimit)}`}
      >
        <Image src={tag.sprite} alt="" width={16} height={16} />
        {count}
      </button>
    </Tooltip>
  );
}

type TierSectionProps = {
  tier: number;
  tagCounts: TagOverview["tierBreakdown"][number];
  superTagCount: number;
  // The whole pack's, for the pack-wide Super limit.
  packSuperTags: number;
  filter: PackFilter;
  onFilterChange: (filter: PackFilter) => void;
  pets: readonly StaticPet[];
  foods: readonly FoodType[];
  petCount: number;
  foodCount: number;
  selectedPetIds: readonly number[];
  selectedFoodIds: readonly number[];
  onTogglePet: (id: number) => void;
  onToggleFood: (id: number) => void;
};

function TierSection({
  tier,
  tagCounts,
  superTagCount,
  packSuperTags,
  filter,
  onFilterChange,
  pets,
  foods,
  petCount,
  foodCount,
  selectedPetIds,
  selectedFoodIds,
  onTogglePet,
  onToggleFood,
}: TierSectionProps) {
  const tagsAtLimit = new Set(
    ALL_TAGS.filter((tag) => (tagCounts[tag] ?? 0) >= MAX_SAME_TAG_PER_TIER).map((tag) => TAG_DISPLAY[tag])
  );
  if (packSuperTags >= MAX_SUPER_TAGS_PER_PACK) tagsAtLimit.add(SUPER_TAG_DISPLAY);

  function getPetHighlight(pet: StaticPet): ItemHighlight {
    if (!selectedPetIds.includes(pet.id)) return ItemHighlight.None;
    if (petCount > PETS_PER_TIER) return ItemHighlight.Invalid;
    const isWildReason =
      pet.tags.some((tag) => (tagCounts[tag] ?? 0) > MAX_SAME_TAG_PER_TIER) ||
      (packSuperTags > MAX_SUPER_TAGS_PER_PACK && pet.superTags > 0);
    return isWildReason ? ItemHighlight.Wild : ItemHighlight.Selected;
  }

  function getFoodHighlight(food: FoodType): ItemHighlight {
    if (!selectedFoodIds.includes(food.id)) return ItemHighlight.None;
    return foodCount > FOODS_PER_TIER ? ItemHighlight.Invalid : ItemHighlight.Selected;
  }

  return (
    <section aria-label={`Tier ${tier} section`} className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-medium">Tier {tier}</h2>
        {/* Like the main tags, packs and dice: clicking selects them there too. */}
        <div role="group" aria-label={`Tier ${tier} tags`} className="flex flex-wrap gap-0.5">
          {ALL_TAGS.map((tag) => (
            <MiniTagButton
              key={tag}
              tier={tier}
              tag={TAG_DISPLAY[tag]}
              count={tagCounts[tag] ?? 0}
              overLimit={(tagCounts[tag] ?? 0) > MAX_SAME_TAG_PER_TIER}
              selected={filter.tags.includes(tag)}
              onSelect={(addToSelection) => onFilterChange(selectTag(filter, tag, addToSelection))}
            />
          ))}
          <MiniTagButton
            tier={tier}
            tag={SUPER_TAG_DISPLAY}
            count={superTagCount}
            // The Super limit is for the whole pack, shown next to the badge.
            overLimit={false}
            selected={filter.superTag}
            onSelect={(addToSelection) => onFilterChange(selectSuperTag(filter, addToSelection))}
          />
        </div>
        <div role="group" aria-label={`Tier ${tier} packs`} className="flex flex-wrap gap-0.5">
          {ALL_PACK_SOURCES.map((source) => (
            <PackSourceButton
              key={source}
              source={source}
              selected={filter.packSources.includes(source)}
              onSelect={(addToSelection) => onFilterChange(selectPackSource(filter, source, addToSelection))}
              mini
            />
          ))}
        </div>
        <div role="group" aria-label={`Tier ${tier} dice`} className="ml-auto flex gap-0.5">
          {TIER_DICE.map((die, index) => {
            const dieTier = index + 1;
            const selected = filter.tiers.includes(dieTier);
            return (
              <button
                key={dieTier}
                {...selectionHandlers((addToSelection) => onFilterChange(selectTier(filter, dieTier, addToSelection)))}
                aria-label={`Show tier ${dieTier}`}
                aria-pressed={selected}
                className={`px-1 text-lg leading-none ${toggleButtonClass(selected)}`}
              >
                {die}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-start gap-4">
        <div className="flex flex-1 min-w-0 flex-col gap-1">
          <span className={`text-sm text-zinc-600 dark:text-zinc-400 ${invalidClass(petCount !== PETS_PER_TIER)}`}>
            Pets {petCount} / {PETS_PER_TIER}
          </span>
          <div role="group" aria-label={`Tier ${tier} pets`} className="flex flex-wrap gap-1">
            {pets.map((pet) => (
              <PackItem
                key={pet.id}
                entry={pet}
                selected={selectedPetIds.includes(pet.id)}
                highlight={getPetHighlight(pet)}
                tagsAtLimit={tagsAtLimit}
                onToggle={() => onTogglePet(pet.id)}
              />
            ))}
          </div>
        </div>
        <div className="flex w-48 shrink-0 flex-col gap-1">
          <span className={`text-sm text-zinc-600 dark:text-zinc-400 ${invalidClass(foodCount !== FOODS_PER_TIER)}`}>
            Foods {foodCount} / {FOODS_PER_TIER}
          </span>
          <div role="group" aria-label={`Tier ${tier} foods`} className="flex flex-wrap gap-1">
            {foods.map((food) => (
              <PackItem
                key={food.id}
                entry={food}
                selected={selectedFoodIds.includes(food.id)}
                highlight={getFoodHighlight(food)}
                tagsAtLimit={tagsAtLimit}
                onToggle={() => onToggleFood(food.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

enum SettingsPanel {
  Menu,
  ChangeName,
  Export,
  Import,
}

type SettingsModalProps = {
  pack: Pack;
  onRename: (name: string, icon: number) => void;
  onImport: (pack: Pack) => void;
  onRandomize: () => void;
  onClear: () => void;
  onClose: () => void;
};

function SettingsModal({ pack, onRename, onImport, onRandomize, onClear, onClose }: SettingsModalProps) {
  const [panel, setPanel] = useState(SettingsPanel.Menu);
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const { name, icon } = pack.data;
  // Pets whose name matches the search, always including the current icon.
  const iconPets = NON_TOKEN_PETS.filter(
    (pet) => pet.id === icon || pet.name.toLowerCase().includes(iconSearch.trim().toLowerCase())
  );

  function exportPack() {
    setPanel(SettingsPanel.Export);
    navigator.clipboard?.writeText(pack.toCode()).then(() => setCopied(true), () => setCopied(false));
  }

  function importPack() {
    try {
      onImport(Pack.fromCode(importCode));
      onClose();
    } catch (error) {
      setImportError((error as Error).message);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pack settings"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 p-4">
        <div className="flex items-center justify-end">
          {panel !== SettingsPanel.Menu && (
            <button onClick={() => setPanel(SettingsPanel.Menu)} aria-label="Back" className="mr-auto text-zinc-600 dark:text-zinc-400">
              ←
            </button>
          )}
          <button onClick={onClose} aria-label="Close" className="font-bold leading-none text-zinc-600 dark:text-zinc-400">
            ✕
          </button>
        </div>

        {panel === SettingsPanel.Menu && (
          <>
            <button onClick={() => setPanel(SettingsPanel.ChangeName)} className={`px-4 py-2 text-left ${BUTTON_CLASS}`}>
              Change name
            </button>
            <button onClick={exportPack} className={`px-4 py-2 text-left ${BUTTON_CLASS}`}>
              Export
            </button>
            <button onClick={() => setPanel(SettingsPanel.Import)} className={`px-4 py-2 text-left ${BUTTON_CLASS}`}>
              Import
            </button>
            {/* Tags are ignored, so a random pack may be WILD. */}
            <button onClick={onRandomize} className={`px-4 py-2 text-left ${BUTTON_CLASS}`}>
              Randomize
            </button>
            <button onClick={onClear} className={`px-4 py-2 text-left ${BUTTON_CLASS}`}>
              Clear
            </button>
            {/* Packs are saved from PR 3. */}
            <button disabled className={`px-4 py-2 text-left disabled:opacity-60 ${BUTTON_CLASS}`}>
              Delete
            </button>
          </>
        )}

        {panel === SettingsPanel.ChangeName && (
          <>
            <input
              value={name}
              onChange={(event) => onRename(event.target.value, icon)}
              aria-label="Pack name"
              className={`px-3 py-2 ${BUTTON_CLASS}`}
            />
            <input
              value={iconSearch}
              onChange={(event) => setIconSearch(event.target.value)}
              placeholder="Search icons..."
              aria-label="Search icons"
              className={`px-3 py-2 ${BUTTON_CLASS}`}
            />
            <select
              value={icon}
              onChange={(event) => onRename(name, Number(event.target.value))}
              aria-label="Pack icon"
              className={`px-3 py-2 ${BUTTON_CLASS}`}
            >
              {iconPets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </>
        )}

        {panel === SettingsPanel.Export && (
          <>
            <input readOnly value={pack.toCode()} aria-label="Pack code" className={`px-3 py-2 ${BUTTON_CLASS}`} />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {copied ? "Copied to the clipboard." : "Copy the code above."}
            </span>
          </>
        )}

        {panel === SettingsPanel.Import && (
          <>
            <input
              value={importCode}
              onChange={(event) => setImportCode(event.target.value)}
              placeholder="Paste a pack code"
              aria-label="Pack code"
              className={`px-3 py-2 ${BUTTON_CLASS}`}
            />
            <button onClick={importPack} className={`px-4 py-2 ${BUTTON_CLASS}`}>
              Import
            </button>
            {importError && (
              <span role="alert" className="text-sm text-red-600 dark:text-red-400">
                {importError}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PackEditor() {
  const [serializedPack, setSerializedPack] = useState(NEW_PACK);
  const [filter, setFilter] = useState<PackFilter>(NO_PACK_FILTER);
  const [packViewerOpen, setPackViewerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pack = useMemo(() => Pack.fromSerialized(serializedPack), [serializedPack]);
  const { superTags, tierBreakdown } = pack.tagOverview();
  const shownPets = filterPack(NON_TOKEN_PETS, filter);
  const shownFoods = filterPack(NON_TOKEN_FOODS, filter);
  const iconPet = PET_BY_ID[pack.data.icon];
  const isWild = pack.isWild();

  return (
    <div className="flex flex-col gap-4">
      <PackFilterBar filter={filter} onFilterChange={setFilter}>
        <Tooltip text="View pack">
          <button onClick={() => setPackViewerOpen(true)} aria-label="View pack" className={`px-3 py-1 ${BUTTON_CLASS}`}>
            🐾
          </button>
        </Tooltip>
        <Tooltip text="Pack settings">
          <button onClick={() => setSettingsOpen(true)} aria-label="Pack settings" className={`px-3 py-1 ${BUTTON_CLASS}`}>
            🔧
          </button>
        </Tooltip>
      </PackFilterBar>

      <div className="flex flex-wrap items-center gap-3">
        {/* An imported code can name a token or unknown pet. */}
        <div
          aria-label="Pack icon"
          className={`relative w-10 h-10 rounded-lg border-2 ${
            !iconPet || iconPet.isToken ? "border-red-600" : "border-transparent"
          }`}
        >
          {iconPet && <Image src={iconPet.sprite} alt={iconPet.name} fill sizes="40px" unoptimized className="object-contain" />}
        </div>
        <span aria-label="Pack name" className={`text-lg font-medium ${invalidClass(!isAllowedPackName(pack.data.name))}`}>
          {pack.data.name.trim() === "" ? "(no name)" : pack.data.name}
        </span>
        <span
          aria-label="Pack status"
          className={`rounded px-2 py-0.5 text-sm font-bold ${
            isWild ? "bg-pink-500 text-white" : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
          }`}
        >
          {isWild ? "WILD" : "Standard"}
        </span>
        <Tooltip text={SUPER_TAG_DISPLAY.label}>
          <span aria-label={`Super ${superTags}`} className={`flex items-center gap-1 text-sm ${wildClass(superTags > MAX_SUPER_TAGS_PER_PACK)}`}>
            <Image src={SUPER_TAG_DISPLAY.sprite} alt="" width={16} height={16} />
            {superTags} / {MAX_SUPER_TAGS_PER_PACK}
          </span>
        </Tooltip>
      </div>

      {pack.data.tier.map(({ pets, foods }, index) => {
        const tier = index + 1;
        const tierPets = shownPets.filter((pet) => pet.tier === tier);
        const tierFoods = shownFoods.filter((food) => food.tier === tier);
        // Tiers with nothing left after filtering are hidden.
        if (tierPets.length === 0 && tierFoods.length === 0) return null;
        return (
          <TierSection
            key={tier}
            tier={tier}
            tagCounts={tierBreakdown[index]}
            superTagCount={pets.reduce((total, pet) => total + pet.superTags, 0)}
            packSuperTags={superTags}
            filter={filter}
            onFilterChange={setFilter}
            pets={tierPets}
            foods={tierFoods}
            petCount={pets.length}
            foodCount={foods.length}
            selectedPetIds={serializedPack.pets}
            selectedFoodIds={serializedPack.foods}
            onTogglePet={(id) => setSerializedPack({ ...serializedPack, pets: toggleId(serializedPack.pets, id) })}
            onToggleFood={(id) => setSerializedPack({ ...serializedPack, foods: toggleId(serializedPack.foods, id) })}
          />
        );
      })}

      {settingsOpen && (
        <SettingsModal
          pack={pack}
          onRename={(name, icon) => setSerializedPack({ ...serializedPack, name, icon })}
          onImport={(importedPack) => setSerializedPack(importedPack.serialize())}
          onRandomize={() => {
            setSerializedPack({ ...serializedPack, ...getRandomPackIds() });
            setSettingsOpen(false);
          }}
          onClear={() => {
            setSerializedPack({ ...serializedPack, pets: [], foods: [] });
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {packViewerOpen && (
        <PackViewer
          pack={pack}
          onClose={() => setPackViewerOpen(false)}
          onMovePet={(movedId, targetId) =>
            setSerializedPack({ ...serializedPack, pets: moveId(serializedPack.pets, movedId, targetId) })
          }
          onMoveFood={(movedId, targetId) =>
            setSerializedPack({ ...serializedPack, foods: moveId(serializedPack.foods, movedId, targetId) })
          }
        />
      )}
    </div>
  );
}
