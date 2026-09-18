"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BattleStep, PetInstance } from "@/lib/types";
import { PET_SPRITES, FOOD_SPRITES } from "@/lib/sprites";
import { PET_REGISTRY, getPetDescription } from "@/lib/pets";
import { FOOD_REGISTRY } from "@/lib/foods";
import { startGame } from "@/app/actions/game";
import Tooltip from "./Tooltip";

type BattleData = {
  opponentTeam: PetInstance[];
  result: "WIN" | "DRAW" | "LOSS";
  steps: BattleStep[];
};

type BattleViewProps = {
  battleData: BattleData;
  gameWon: boolean;
  onBackToShop: () => void;
};

type AnimatingPet = { pet: PetInstance; animClass: string };

export default function BattleView({ battleData, gameWon, onBackToShop }: BattleViewProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const prevStepRef = useRef<BattleStep | null>(null);
  const done = stepIndex >= battleData.steps.length - 1;

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => {
      prevStepRef.current = battleData.steps[stepIndex];
      setStepIndex((i) => i + 1);
    }, 1200);
    return () => clearTimeout(timer);
  }, [stepIndex, done, battleData.steps]);

  const currentStep = battleData.steps[stepIndex];
  const prevStep = prevStepRef.current;

  function getAttackerAnim(index: number): string {
    if (!prevStep || stepIndex === 0) return "";
    // Front pet (index 0) is attacking this step
    if (index === 0 && prevStep.attackerTeam.length > 0) return "animate-sap-attack";
    return "";
  }

  function getDefenderAnim(index: number): string {
    if (!prevStep || stepIndex === 0) return "";
    if (index === 0 && prevStep.defenderTeam.length > 0) return "animate-sap-attack";
    return "";
  }

  function wasFainting(
    prevTeam: PetInstance[],
    currentTeam: PetInstance[]
  ): AnimatingPet[] {
    if (!prevStep) return [];
    // Pets that existed in prev step but are gone now
    const fainted = prevTeam.slice(currentTeam.length);
    return fainted.map((pet) => ({ pet, animClass: "animate-sap-faint" }));
  }

  const faintedAttackers = wasFainting(
    prevStep?.attackerTeam ?? [],
    currentStep.attackerTeam
  );
  const faintedDefenders = wasFainting(
    prevStep?.defenderTeam ?? [],
    currentStep.defenderTeam
  );

  const resultColor =
    battleData.result === "WIN"
      ? "text-green-500"
      : battleData.result === "LOSS"
      ? "text-red-500"
      : "text-zinc-400";

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <h2 className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">Battle</h2>

      <div className="flex items-center justify-center gap-8">
        {/* Player team — facing right (default) */}
        <div className="flex flex-row-reverse gap-2">
          {currentStep.attackerTeam.map((pet, i) => (
            <PetCard
              key={i}
              pet={pet}
              facing="right"
              animClass={getAttackerAnim(i)}
            />
          ))}
          {faintedAttackers.map(({ pet, animClass }, i) => (
            <PetCard key={`faint-a-${i}`} pet={pet} facing="right" animClass={animClass} />
          ))}
        </div>

        <span className="text-2xl font-bold text-zinc-400">VS</span>

        {/* Enemy team — facing left (mirrored) */}
        <div className="flex flex-row gap-2">
          {currentStep.defenderTeam.map((pet, i) => (
            <PetCard
              key={i}
              pet={pet}
              facing="left"
              animClass={getDefenderAnim(i)}
            />
          ))}
          {faintedDefenders.map(({ pet, animClass }, i) => (
            <PetCard key={`faint-d-${i}`} pet={pet} facing="left" animClass={animClass} />
          ))}
        </div>
      </div>

      {/* Step description */}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 h-6">
        {currentStep.description}
      </p>

      {/* Result */}
      {done && (
        <div className="text-center">
          {gameWon ? (
            <>
              <p className="text-4xl font-bold text-yellow-500">You Won!</p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Back to Menu
                </button>
                <form action={startGame}>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
                  >
                    Play Again
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <p className={`text-4xl font-bold ${resultColor}`}>{battleData.result}</p>
              <button
                onClick={onBackToShop}
                className="mt-4 px-6 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Back to Shop
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PetCard({
  pet,
  facing,
  animClass,
}: {
  pet: PetInstance;
  facing: "left" | "right";
  animClass: string;
}) {
  const sprite = PET_SPRITES[pet.type];
  return (
    <div
      className={[
        "relative w-20 h-20 rounded-xl border-2 border-zinc-400 dark:border-zinc-500 bg-zinc-50 dark:bg-zinc-800 flex flex-col items-center justify-center p-1",
        animClass,
      ].join(" ")}
    >
      {sprite ? (
        <Tooltip
          text={
            PET_REGISTRY[pet.type] &&
            getPetDescription(PET_REGISTRY[pet.type], pet.level)
          }
        >
          <div
            className="relative w-10 h-10"
            style={facing === "left" ? { transform: "scaleX(-1)" } : undefined}
          >
            <Image src={sprite} alt={pet.type} fill className="object-contain" />
          </div>
        </Tooltip>
      ) : (
        <span className="text-xs font-semibold">{pet.type}</span>
      )}
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {pet.attack}/{pet.health}
      </span>
      {pet.perk && FOOD_SPRITES[pet.perk] && (
        <Tooltip
          text={FOOD_REGISTRY[pet.perk]?.description}
          className="absolute top-1 right-1 w-4 h-4"
        >
          <Image src={FOOD_SPRITES[pet.perk]} alt={pet.perk} fill className="object-contain" />
        </Tooltip>
      )}
    </div>
  );
}
