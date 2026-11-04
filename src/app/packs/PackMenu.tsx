"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { Turtle } from "@/lib/pets";
import Link from "next/link";
import PackViewer from "@/app/arena/[gameId]/PackViewer";
import { BUTTON_CLASS } from "./styles";

enum MatchmakingMode {
  SamePack,
  AllPacks,
}

const MATCHMAKING_BUTTONS: Record<MatchmakingMode, { icon: string; label: string; next: MatchmakingMode }> = {
  [MatchmakingMode.SamePack]: { icon: "🗡️", label: "Same pack", next: MatchmakingMode.AllPacks },
  [MatchmakingMode.AllPacks]: { icon: "⚔️", label: "All packs", next: MatchmakingMode.SamePack },
};

enum PackCard {
  Turtle,
  NewPack,
}

type PackCardFrameProps = {
  selected: boolean;
  onSelect: () => void;
  selectLabel: string;
  // The corner button (🔍 or 🔧).
  action: ReactNode;
  children: ReactNode;
};

function PackCardFrame({ selected, onSelect, selectLabel, action, children }: PackCardFrameProps) {
  return (
    <div
      className={`relative flex items-center justify-center w-40 h-40 rounded-xl bg-white dark:bg-zinc-900 ${
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
      <div className="absolute top-1 right-1">{action}</div>
    </div>
  );
}

type PackMenuProps = {
  startGame: () => void | Promise<void>;
};

export default function PackMenu({ startGame }: PackMenuProps) {
  const [matchmakingMode, setMatchmakingMode] = useState(MatchmakingMode.SamePack);
  const [selectedCard, setSelectedCard] = useState(PackCard.Turtle);
  const [packViewerOpen, setPackViewerOpen] = useState(false);
  const matchmakingButton = MATCHMAKING_BUTTONS[matchmakingMode];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <button
          onClick={() => setMatchmakingMode(matchmakingButton.next)}
          aria-label={matchmakingButton.label}
          title={matchmakingButton.label}
          className={`px-4 py-2 text-lg ${BUTTON_CLASS}`}
        >
          {matchmakingButton.icon}
        </button>
        <form action={startGame}>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Start game
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-4">
        <PackCardFrame
          selected={selectedCard === PackCard.Turtle}
          onSelect={() => setSelectedCard(PackCard.Turtle)}
          selectLabel="Select Turtle pack"
          action={
            <button
              onClick={() => setPackViewerOpen(true)}
              aria-label="View Turtle pack"
              className={`px-2 py-1 text-sm ${BUTTON_CLASS}`}
            >
              🔍
            </button>
          }
        >
          <div className="relative w-16 h-16">
            <Image src={Turtle.sprite} alt={Turtle.name} fill sizes="64px" className="object-contain" />
          </div>
          <span className="font-medium">{Turtle.name}</span>
        </PackCardFrame>

        <PackCardFrame
          selected={selectedCard === PackCard.NewPack}
          onSelect={() => setSelectedCard(PackCard.NewPack)}
          selectLabel="Select new pack"
          action={
            <Link href="/packs/editor" aria-label="Edit new pack" className={`block px-2 py-1 text-sm ${BUTTON_CLASS}`}>
              🔧
            </Link>
          }
        >
          <span className="text-4xl">➕</span>
        </PackCardFrame>
      </div>

      {packViewerOpen && <PackViewer onClose={() => setPackViewerOpen(false)} />}
    </div>
  );
}
