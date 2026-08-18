import type { PetInstance, BattleStep, PetType, BattleAbilityContext } from "@/lib/types";

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

function removeDeadPets(team: PetInstance[]): void {
  for (let i = team.length - 1; i >= 0; i--) {
    if (team[i].health <= 0) team.splice(i, 1);
  }
}

function fireFriendSummoned(
  team: PetInstance[],
  summonedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>
): void {
  for (let i = 0; i < team.length; i++) {
    if (i === summonedIndex) continue;
    const pet = team[i];
    const def = petRegistry[pet.type];
    if (def?.ability?.trigger === "friend-summoned") {
      const ctx: BattleAbilityContext = {
        self: pet,
        selfIndex: i,
        team,
        enemyTeam,
        level: pet.level,
        summon: () => {},
        summonedIndex,
      };
      def.ability.fn(ctx);
    }
  }
}

function handleFaint(
  team: PetInstance[],
  faintedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>
): void {
  const fainted = team[faintedIndex];
  const pendingSummons: { pet: PetInstance; afterIndex: number }[] = [];

  const summon = (pet: PetInstance, afterIndex: number) => {
    pendingSummons.push({ pet, afterIndex });
  };

  // 1. Fire faint ability
  const def = petRegistry[fainted.type];
  if (def?.ability?.trigger === "faint") {
    const ctx: BattleAbilityContext = {
      self: fainted,
      selfIndex: faintedIndex,
      team,
      enemyTeam,
      level: fainted.level,
      summon,
    };
    def.ability.fn(ctx);
  }

  // 2. Honey perk — queue a Bee summon at the same position
  if (fainted.perk === "Honey") {
    pendingSummons.push({
      pet: { type: "Bee", attack: 1, health: 1, perk: null, xp: 0, level: 1 },
      afterIndex: faintedIndex,
    });
  }

  // 3. Remove fainted pet
  team.splice(faintedIndex, 1);

  // 4. Insert summoned pets (up to team cap of 5) and fire friend-summoned
  for (const { pet, afterIndex } of pendingSummons) {
    if (team.length >= 5) continue;
    const insertAt = Math.min(afterIndex, team.length);
    team.splice(insertAt, 0, pet);
    fireFriendSummoned(team, insertAt, enemyTeam, petRegistry);
  }
}

function fireStartOfBattle(
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>
): void {
  const count = team.length;
  for (let i = 0; i < count; i++) {
    const pet = team[i];
    const def = petRegistry[pet.type];
    if (def?.ability?.trigger === "start-of-battle") {
      const ctx: BattleAbilityContext = {
        self: pet,
        selfIndex: i,
        team,
        enemyTeam,
        level: pet.level,
        summon: (p, afterIndex) => {
          if (team.length < 5) {
            const insertAt = Math.min(afterIndex, team.length);
            team.splice(insertAt, 0, p);
            fireFriendSummoned(team, insertAt, enemyTeam, petRegistry);
          }
        },
      };
      def.ability.fn(ctx);
    }
  }
}

export function simulateBattle(
  playerTeam: (PetInstance | null)[],
  opponentTeam: (PetInstance | null)[],
  petRegistry: Record<string, PetType> = {}
): BattleSimulationResult {
  let attacker: PetInstance[] = compactTeam(playerTeam);
  let defender: PetInstance[] = compactTeam(opponentTeam);
  const steps: BattleStep[] = [];

  steps.push({
    attackerTeam: attacker.map(clonePet),
    defenderTeam: defender.map(clonePet),
    description: "Battle start",
  });

  // Start-of-battle abilities fire left-to-right for each team
  fireStartOfBattle(attacker, defender, petRegistry);
  fireStartOfBattle(defender, attacker, petRegistry);
  removeDeadPets(attacker);
  removeDeadPets(defender);

  let rounds = 0;
  const MAX_ROUNDS = 50;

  while (attacker.length > 0 && defender.length > 0 && rounds < MAX_ROUNDS) {
    rounds++;
    const atkFront = attacker[0];
    const defFront = defender[0];

    const description = `${atkFront.type} (${atkFront.attack}/${atkFront.health}) attacks ${defFront.type} (${defFront.attack}/${defFront.health})`;

    defFront.health -= atkFront.attack;
    atkFront.health -= defFront.attack;

    if (atkFront.health <= 0) {
      handleFaint(attacker, 0, defender, petRegistry);
    }
    if (defFront.health <= 0) {
      handleFaint(defender, 0, attacker, petRegistry);
    }

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
