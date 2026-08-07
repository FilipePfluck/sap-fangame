import type { PetInstance, BattleStep } from "@/lib/types";

export type BattleSimulationResult = {
  result: "WIN" | "DRAW" | "LOSS";
  steps: BattleStep[];
};

function clonePet(p: PetInstance): PetInstance {
  return { ...p };
}

function compactTeam(team: (PetInstance | null)[]): PetInstance[] {
  return team.filter((p): p is PetInstance => p !== null).map(clonePet);
}

export function simulateBattle(
  playerTeam: (PetInstance | null)[],
  opponentTeam: (PetInstance | null)[]
): BattleSimulationResult {
  let attacker: PetInstance[] = compactTeam(playerTeam);
  let defender: PetInstance[] = compactTeam(opponentTeam);
  const steps: BattleStep[] = [];

  steps.push({
    attackerTeam: attacker.map(clonePet),
    defenderTeam: defender.map(clonePet),
    description: "Battle start",
  });

  let rounds = 0;
  const MAX_ROUNDS = 50;

  while (attacker.length > 0 && defender.length > 0 && rounds < MAX_ROUNDS) {
    rounds++;
    const atkFront = attacker[0];
    const defFront = defender[0];

    const description = `${atkFront.type} (${atkFront.attack}/${atkFront.health}) attacks ${defFront.type} (${defFront.attack}/${defFront.health})`;

    defFront.health -= atkFront.attack;
    atkFront.health -= defFront.attack;

    if (atkFront.health <= 0) attacker.shift();
    if (defFront.health <= 0) defender.shift();

    steps.push({
      attackerTeam: attacker.map(clonePet),
      defenderTeam: defender.map(clonePet),
      description,
    });
  }

  let result: "WIN" | "DRAW" | "LOSS";
  if (attacker.length > 0 && defender.length === 0) {
    result = "WIN";
  } else if (attacker.length === 0 && defender.length > 0) {
    result = "LOSS";
  } else {
    result = "DRAW";
  }

  return { result, steps };
}
