"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Board, ShopState, PetInstance } from "@/lib/types";
import { PET_SPRITES, FOOD_SPRITES } from "@/lib/sprites";
import ShopItem from "./ShopItem";
import BoardSlot from "./BoardSlot";
import BattleView from "./BattleView";

type BattleData = {
  opponentTeam: PetInstance[];
  result: "WIN" | "DRAW" | "LOSS";
  steps: Array<{
    attackerTeam: PetInstance[];
    defenderTeam: PetInstance[];
    description: string;
  }>;
};

type GameClientProps = {
  gameId: string;
  initialBoard: Board;
  initialShop: ShopState;
  initialGold: number;
  initialLives: number;
  initialTrophies: number;
  initialTurn: number;
};

export default function GameClient({
  gameId,
  initialBoard,
  initialShop,
  initialGold,
  initialLives,
  initialTrophies,
  initialTurn,
}: GameClientProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<"shop" | "battle">("shop");
  const [board, setBoard] = useState<Board>(initialBoard);
  const [shop, setShop] = useState<ShopState>(initialShop);
  const [gold, setGold] = useState(initialGold);
  const [lives] = useState(initialLives);
  const [trophies] = useState(initialTrophies);
  const [turn] = useState(initialTurn);

  const [selectedItem, setSelectedItem] = useState<{
    kind: "pet" | "food";
    index: number;
  } | null>(null);
  const [selectedBoardIndex, setSelectedBoardIndex] = useState<number | null>(null);
  const [frozenPets, setFrozenPets] = useState<Set<number>>(
    () => new Set(initialShop.shopPets.flatMap((p, i) => (p.frozen ? [i] : [])))
  );
  const [frozenFoods, setFrozenFoods] = useState<Set<number>>(
    () => new Set(initialShop.shopFoods.flatMap((f, i) => (f.frozen ? [i] : [])))
  );

  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [gameWon, setGameWon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSelectShopPet(index: number) {
    setSelectedBoardIndex(null);
    setSelectedItem((prev) =>
      prev?.kind === "pet" && prev.index === index ? null : { kind: "pet", index }
    );
  }

  function handleSelectShopFood(index: number) {
    setSelectedBoardIndex(null);
    setSelectedItem((prev) =>
      prev?.kind === "food" && prev.index === index ? null : { kind: "food", index }
    );
  }

  function handleFreezeToggle(kind: "pet" | "food", index: number) {
    if (kind === "pet") {
      setFrozenPets((prev) => {
        const next = new Set(prev);
        next.has(index) ? next.delete(index) : next.add(index);
        return next;
      });
    } else {
      setFrozenFoods((prev) => {
        const next = new Set(prev);
        next.has(index) ? next.delete(index) : next.add(index);
        return next;
      });
    }
  }

  function handleContextMenu(
    e: React.MouseEvent,
    kind: "pet" | "food",
    index: number
  ) {
    e.preventDefault();
    handleFreezeToggle(kind, index);
  }

  async function handleBoardSlotClick(boardPosition: number) {
    if (selectedItem) {
      // Buy mode: place shop item onto board
      const endpoint = selectedItem.kind === "pet" ? "buy-pet" : "buy-food";
      setLoading(true);
      try {
        const res = await fetch(`/api/game/${gameId}/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopPosition: selectedItem.index, boardPosition }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }
        setBoard(data.board);
        setShop(data.shop);
        setGold(data.gold);
        setSelectedItem(null);
      } finally {
        setLoading(false);
      }
    } else {
      // Select/deselect a board pet for selling
      const pet = board[boardPosition];
      if (!pet) return;
      setSelectedBoardIndex((prev) => (prev === boardPosition ? null : boardPosition));
    }
  }

  async function handleSellPet() {
    if (selectedBoardIndex === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/game/${gameId}/sell-pet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardPosition: selectedBoardIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setBoard(data.board);
      setGold(data.gold);
      setSelectedBoardIndex(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoll() {
    setLoading(true);
    try {
      const res = await fetch(`/api/game/${gameId}/roll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frozenPetPositions: [...frozenPets],
          frozenFoodPositions: [...frozenFoods],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setShop(data.shop);
      setGold(data.gold);
      setFrozenPets(
        new Set(data.shop.shopPets.flatMap((p: { frozen: boolean }, i: number) => (p.frozen ? [i] : [])))
      );
      setFrozenFoods(
        new Set(data.shop.shopFoods.flatMap((f: { frozen: boolean }, i: number) => (f.frozen ? [i] : [])))
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEndTurn() {
    setLoading(true);
    try {
      const endRes = await fetch(`/api/game/${gameId}/end`, { method: "POST" });
      const endData = await endRes.json();
      if (!endRes.ok) {
        setError(endData.error ?? "Something went wrong");
        return;
      }

      const watchRes = await fetch(
        `/api/game/${gameId}/watch/${endData.battleId}`
      );
      const battle = await watchRes.json();
      setBattleData(battle);
      setGameWon(endData.result === "WIN" && trophies + 1 >= 10);
      setPhase("battle");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToShop() {
    router.refresh();
  }

  const hasSelection = selectedItem !== null;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 dark:bg-black font-sans py-8 px-4">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          >
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto font-bold leading-none"
            >
              ✕
            </button>
          </div>
        )}

        {/* HUD */}
        <div className="flex items-center justify-between text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <span>
            Lives: {Array.from({ length: lives }, (_, i) => (
              <span key={i} className="text-red-500">♥</span>
            ))}
            {Array.from({ length: 5 - lives }, (_, i) => (
              <span key={i} className="text-zinc-300 dark:text-zinc-600">♥</span>
            ))}
          </span>
          <span>Turn {turn}</span>
          <span>Trophies: {trophies}</span>
          <span className="font-bold text-yellow-600 dark:text-yellow-400">{gold}g</span>
        </div>

        {phase === "shop" ? (
          <>
            {/* Board */}
            <div>
              <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wide">Your Team</p>
              <div className="flex gap-2 justify-center">
                {Array.from({ length: 5 }, (_, displayIdx) => {
                  const i = 4 - displayIdx;
                  const pet = board[i];
                  return (
                    <BoardSlot
                      key={i}
                      pet={pet}
                      sprite={pet ? (PET_SPRITES[pet.type] ?? null) : null}
                      isSelected={selectedBoardIndex === i}
                      isTargetable={hasSelection && (selectedItem.kind === "pet" ? pet === null : pet !== null)}
                      onClick={() => handleBoardSlotClick(i)}
                    />
                  );
                })}
              </div>
              {selectedBoardIndex !== null && board[selectedBoardIndex] && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleSellPet}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-40 transition-colors"
                  >
                    Sell (+{board[selectedBoardIndex]!.level}g)
                  </button>
                </div>
              )}
            </div>

            {/* Shop */}
            <div className="flex gap-4 min-w-0">
              {/* Pet shop */}
              <div className="min-w-0">
                <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wide">Pet Shop</p>
                <div className="flex gap-3 pb-8 overflow-x-auto">
                  {shop.shopPets.map((pet, i) => (
                    <ShopItem
                      key={i}
                      name={pet.type}
                      sprite={PET_SPRITES[pet.type] ?? ""}
                      subtitle="1/1"
                      isSelected={selectedItem?.kind === "pet" && selectedItem.index === i}
                      isFrozen={frozenPets.has(i)}
                      onSelect={() => handleSelectShopPet(i)}
                      onFreeze={() => handleFreezeToggle("pet", i)}
                      onContextMenu={(e) => handleContextMenu(e, "pet", i)}
                    />
                  ))}
                </div>
              </div>

              {/* Food shop */}
              <div className="shrink-0">
                <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wide">Food Shop</p>
                <div className="flex gap-3 pb-8">
                  {shop.shopFoods.map((food, i) => (
                    <ShopItem
                      key={i}
                      name={food.type}
                      sprite={FOOD_SPRITES[food.type] ?? ""}
                      subtitle="+1/+1"
                      isSelected={selectedItem?.kind === "food" && selectedItem.index === i}
                      isFrozen={frozenFoods.has(i)}
                      onSelect={() => handleSelectShopFood(i)}
                      onFreeze={() => handleFreezeToggle("food", i)}
                      onContextMenu={(e) => handleContextMenu(e, "food", i)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={handleRoll}
                disabled={loading || gold < 1}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                Roll (1g)
              </button>
              <button
                onClick={handleEndTurn}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
              >
                {loading ? "…" : "End Turn"}
              </button>
            </div>
          </>
        ) : (
          battleData && (
            <BattleView battleData={battleData} gameWon={gameWon} onBackToShop={handleBackToShop} />
          )
        )}
      </div>
    </div>
  );
}
