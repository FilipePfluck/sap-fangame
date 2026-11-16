"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { PET_BY_ID, Turtle } from "@/lib/pets";
import Link from "next/link";
import { Pack, TURTLE_PACK, hasRoomForPack } from "@/lib/game/pack";
import type { SavedPackJson } from "@/lib/game/pack-request";
import type { SavedPack } from "@/lib/game/pack-store";
import { FOODS_PER_TIER, MAX_PACKS_PER_USER, PETS_PER_TIER } from "@/lib/game/rules";
import { MatchmakingMode } from "@/lib/game/matchmaking";
import PackViewer, { usePreloadPackSprites } from "@/app/arena/[gameId]/PackViewer";
import Tooltip from "@/app/arena/[gameId]/Tooltip";
import { BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from "./styles";

type MatchmakingButton = { icon: string; label: string; description: string; next: MatchmakingMode };

const MATCHMAKING_BUTTONS: Record<MatchmakingMode, MatchmakingButton> = {
  [MatchmakingMode.SamePack]: {
    icon: "🗡️",
    label: "Same pack",
    description: "Play against your own pack.",
    next: MatchmakingMode.AllPacks,
  },
  [MatchmakingMode.AllPacks]: {
    icon: "⚔️",
    label: "All packs",
    description: "Play against all packs.",
    next: MatchmakingMode.SamePack,
  },
};

const CARD_CLASS = "relative flex items-center justify-center w-40 h-40 rounded-xl bg-white dark:bg-zinc-900";

type PackCardFrameProps = {
  selected: boolean;
  onSelect: () => void;
  selectLabel: string;
  // The corner buttons (🔍 and 🔧).
  actions: ReactNode;
  children: ReactNode;
};

function PackCardFrame({ selected, onSelect, selectLabel, actions, children }: PackCardFrameProps) {
  return (
    <div
      className={`${CARD_CLASS} ${
        selected ? "border-2 border-zinc-900 dark:border-white" : "border border-zinc-300 dark:border-zinc-600"
      }`}
    >
      <button
        onClick={onSelect}
        aria-label={selectLabel}
        aria-pressed={selected}
        className="flex flex-col items-center gap-2"
      >
        {children}
      </button>
      {selected && <span className="absolute top-1 left-2">✅</span>}
      <div className="absolute top-1 right-1 flex gap-1">{actions}</div>
    </div>
  );
}

// Pack spec: what a pack needs before it can start a game.
const INVALID_PACK_TOOLTIP = `Finish this pack to play it: ${PETS_PER_TIER} pets and ${FOODS_PER_TIER} foods in every tier, an allowed name and an icon.`;

const NEW_PACK_CARD_CLASS = `${CARD_CLASS} flex-col gap-2 border border-zinc-300 dark:border-zinc-600`;

function NewPackCardContent() {
  return (
    <>
      <span className="text-4xl">➕</span>
      <span className="font-medium">Custom</span>
    </>
  );
}

function ViewPackButton({ onView }: { onView: () => void }) {
  return (
    <Tooltip text="View pack">
      <button onClick={onView} aria-label="View pack" className={`px-2 py-1 text-sm ${BUTTON_CLASS}`}>
        🔍
      </button>
    </Tooltip>
  );
}

// A saved pack can't be used yet (red) or breaks the tag limits (pink), as in the editor.
function PackStatusLabels({ pack }: { pack: Pack }) {
  return (
    <span className="flex gap-1 text-xs font-bold">
      {!pack.data.isValid && <span className="rounded px-1 bg-red-600 text-white">Invalid</span>}
      {pack.isWild() && <span className="rounded px-1 bg-pink-500 text-white">WILD</span>}
    </span>
  );
}

type ActiveGameButtonsProps = {
  activeGameId: string;
  abandonGame: (gameId: string) => Promise<void>;
};

// Shown instead of Start game while the player has a game in progress.
function ActiveGameButtons({ activeGameId, abandonGame }: ActiveGameButtonsProps) {
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const [isAbandoning, startAbandoning] = useTransition();

  if (!confirmingAbandon) {
    return (
      <>
        <Link href={`/arena/${activeGameId}`} className={PRIMARY_BUTTON_CLASS}>
          Continue
        </Link>
        <button onClick={() => setConfirmingAbandon(true)} className={`px-4 py-2 ${BUTTON_CLASS}`}>
          Abandon
        </button>
      </>
    );
  }

  return (
    <div role="group" aria-label="Abandon game" className="flex items-center gap-3">
      <span>Abandon your game? It will be deleted.</span>
      <button
        onClick={() => startAbandoning(() => abandonGame(activeGameId))}
        disabled={isAbandoning}
        className={`px-4 py-2 text-red-600 disabled:opacity-60 ${BUTTON_CLASS}`}
      >
        Abandon game
      </button>
      <button onClick={() => setConfirmingAbandon(false)} disabled={isAbandoning} className={`px-4 py-2 ${BUTTON_CLASS}`}>
        Keep playing
      </button>
    </div>
  );
}

type PackMenuProps = {
  // `packId` is the selected saved pack, or null for Turtle.
  startGame: (packId: number | null, matchmakingMode: MatchmakingMode) => void | Promise<void>;
  abandonGame: (gameId: string) => Promise<void>;
  // The player's game in progress, if any.
  activeGameId: string | null;
  savedPacks: readonly SavedPackJson[];
};

export default function PackMenu({ startGame, abandonGame, activeGameId, savedPacks }: PackMenuProps) {
  const [matchmakingMode, setMatchmakingMode] = useState(MatchmakingMode.SamePack);
  // Null while the Turtle pack is selected.
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);
  const [viewedPack, setViewedPack] = useState<Pack | null>(null);
  const packCards: SavedPack[] = useMemo(
    () => savedPacks.map(({ id, pack }) => ({ id, pack: Pack.fromSerialized(pack) })),
    [savedPacks]
  );
  const selectedPack = packCards.find(({ id }) => id === selectedPackId)?.pack ?? TURTLE_PACK;
  usePreloadPackSprites(selectedPack);
  const matchmakingButton = MATCHMAKING_BUTTONS[matchmakingMode];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <Tooltip text={`${matchmakingButton.label}\n${matchmakingButton.description}`}>
          <button
            onClick={() => setMatchmakingMode(matchmakingButton.next)}
            aria-label={matchmakingButton.label}
            className={`px-4 py-2 text-lg ${BUTTON_CLASS}`}
          >
            {matchmakingButton.icon}
          </button>
        </Tooltip>
        {activeGameId ? (
          <ActiveGameButtons activeGameId={activeGameId} abandonGame={abandonGame} />
        ) : (
          <Tooltip text={selectedPack.data.isValid ? undefined : INVALID_PACK_TOOLTIP}>
            <form action={startGame.bind(null, selectedPackId, matchmakingMode)}>
              <button type="submit" disabled={!selectedPack.data.isValid} className={PRIMARY_BUTTON_CLASS}>
                Start game
              </button>
            </form>
          </Tooltip>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <PackCardFrame
          selected={selectedPackId === null}
          onSelect={() => setSelectedPackId(null)}
          selectLabel="Select Turtle pack"
          actions={<ViewPackButton onView={() => setViewedPack(TURTLE_PACK)} />}
        >
          <div className="relative w-16 h-16">
            <Image src={Turtle.sprite} alt={Turtle.name} fill sizes="64px" className="object-contain" />
          </div>
          <span className="font-medium">{Turtle.name}</span>
        </PackCardFrame>

        {packCards.map(({ id, pack }) => {
          // A saved icon can name a pet that no longer exists.
          const iconPet = PET_BY_ID[pack.data.icon];
          return (
            <PackCardFrame
              key={id}
              selected={selectedPackId === id}
              onSelect={() => setSelectedPackId(id)}
              selectLabel={`Select ${pack.data.name} pack`}
              actions={
                <>
                  <ViewPackButton onView={() => setViewedPack(pack)} />
                  <Tooltip text="Edit pack">
                    <Link href={`/packs/editor?packId=${id}`} aria-label="Edit pack" className={`block px-2 py-1 text-sm ${BUTTON_CLASS}`}>
                      🔧
                    </Link>
                  </Tooltip>
                </>
              }
            >
              <div className="relative w-16 h-16">
                {iconPet && <Image src={iconPet.sprite} alt={iconPet.name} fill sizes="64px" className="object-contain" />}
              </div>
              <span className="font-medium">{pack.data.name}</span>
              <PackStatusLabels pack={pack} />
            </PackCardFrame>
          );
        })}

        {hasRoomForPack(savedPacks.length) ? (
          <Link href="/packs/editor" aria-label="New custom pack" className={NEW_PACK_CARD_CLASS}>
            <NewPackCardContent />
          </Link>
        ) : (
          <Tooltip text={`You can save up to ${MAX_PACKS_PER_USER} packs.`}>
            <div aria-label="New custom pack" aria-disabled="true" className={`${NEW_PACK_CARD_CLASS} opacity-60`}>
              <NewPackCardContent />
            </div>
          </Tooltip>
        )}
      </div>

      {viewedPack && <PackViewer pack={viewedPack} onClose={() => setViewedPack(null)} />}
    </div>
  );
}
