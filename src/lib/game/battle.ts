import type { PetInstance, BattleStep, PetType, BattleAbilityContext } from "@/lib/types";
import { orderByAttack } from "@/lib/utils/random";

export type BattleSimulationResult = {
  result: "WIN" | "DRAW" | "LOSS";
  steps: BattleStep[];
};

type BattleAbility = { fn: (ctx: BattleAbilityContext) => void };

function clonePet(p: PetInstance): PetInstance {
  return { ...p };
}

function compactTeam(team: (PetInstance | null)[]): PetInstance[] {
  return team.filter((p): p is PetInstance => p !== null).map(clonePet);
}

// Applies Garlic/Melon mitigation and returns the actual damage dealt.
// Battle-only — never persisted back to the board.
function applyPerkDamage(target: PetInstance, rawDamage: number): number {
  let damage = rawDamage;
  if (target.perk === "Garlic") {
    damage = Math.max(2, damage - 2);
  }
  if (target.perk === "Melon") {
    const blocked = Math.min(20, damage);
    damage -= blocked;
    target.perk = null;
  }
  return damage;
}

function nextTriggerCount(
  counts: WeakMap<PetInstance, number>,
  pet: PetInstance
): number {
  const next = (counts.get(pet) ?? 0) + 1;
  counts.set(pet, next);
  return next;
}

// Fires `ability` for `pet`, then repeats it once more at level 1 if a
// Tiger sits directly behind (skipped on the repeat itself).
function fireAbilityOn(
  ability: BattleAbility,
  pet: PetInstance,
  index: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: WeakMap<PetInstance, number>,
  summon: (pet: PetInstance, afterIndex: number) => void,
  summonedIndex?: number,
  levelOverride?: number
): void {
  const triggerCount = nextTriggerCount(counts, pet);
  const ctx: BattleAbilityContext = {
    self: pet,
    selfIndex: index,
    team,
    enemyTeam,
    level: levelOverride ?? pet.level,
    summon,
    summonedIndex,
    triggerCount,
    petRegistry,
  };
  ability.fn(ctx);

  if (levelOverride === undefined && index >= 0 && team[index + 1]?.type === "Tiger") {
    fireAbilityOn(
      ability,
      pet,
      index,
      team,
      enemyTeam,
      petRegistry,
      counts,
      summon,
      summonedIndex,
      1
    );
  }
}

function fireFriendSummoned(
  team: PetInstance[],
  summonedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: WeakMap<PetInstance, number>
): void {
  const candidates: { pet: PetInstance; ability: BattleAbility }[] = [];
  for (let i = 0; i < team.length; i++) {
    if (i === summonedIndex) continue;
    const pet = team[i];
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === "friend-summoned") {
      candidates.push({ pet, ability });
    }
  }

  // Same-trigger pets fire highest-attack first (ties random) per the
  // ability-order spec, rather than in raw board order.
  for (const { pet, ability } of orderByAttack(candidates, (c) => c.pet.attack)) {
    const index = team.indexOf(pet);
    if (index === -1) continue;
    fireAbilityOn(
      ability,
      pet,
      index,
      team,
      enemyTeam,
      petRegistry,
      counts,
      () => {},
      summonedIndex
    );
  }
}

function handleFaint(
  team: PetInstance[],
  faintedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: WeakMap<PetInstance, number>
): void {
  const fainted = team[faintedIndex];
  const pendingSummons: { pet: PetInstance; afterIndex: number }[] = [];

  const summon = (pet: PetInstance, afterIndex: number) => {
    pendingSummons.push({ pet, afterIndex });
  };

  // 1. Fire faint ability
  const def = petRegistry[fainted.type];
  if (def?.ability?.trigger === "faint") {
    fireAbilityOn(
      def.ability,
      fainted,
      faintedIndex,
      team,
      enemyTeam,
      petRegistry,
      counts,
      summon
    );
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
    fireFriendSummoned(team, insertAt, enemyTeam, petRegistry, counts);
  }
}

// Routes deaths through handleFaint (not a bare splice) so faint abilities
// still fire. Pets on both teams that died simultaneously (e.g. a mutual
// front-line kill, or several felled by the same start-of-battle phase) are
// pooled and faint highest-attack-first, per the ability-order spec, rather
// than one team draining fully before the other.
function handleDeathsPhase(
  attacker: PetInstance[],
  defender: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: WeakMap<PetInstance, number>
): void {
  type DeadJob = { pet: PetInstance; team: PetInstance[]; enemyTeam: PetInstance[] };
  const dead: DeadJob[] = [];
  for (const pet of attacker) {
    if (pet.health <= 0) dead.push({ pet, team: attacker, enemyTeam: defender });
  }
  for (const pet of defender) {
    if (pet.health <= 0) dead.push({ pet, team: defender, enemyTeam: attacker });
  }

  for (const { pet, team, enemyTeam } of orderByAttack(dead, (d) => d.pet.attack)) {
    const index = team.indexOf(pet);
    if (index === -1) continue;
    handleFaint(team, index, enemyTeam, petRegistry, counts);
  }
}

// Fires "start-of-battle" across BOTH teams as one combined, highest-attack-
// first phase (ties random) — not one team draining entirely before the
// other, per the ability-order spec.
function fireStartOfBattlePhase(
  attacker: PetInstance[],
  defender: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: WeakMap<PetInstance, number>
): void {
  type Job = { pet: PetInstance; team: PetInstance[]; enemyTeam: PetInstance[]; ability: BattleAbility };
  const jobs: Job[] = [];
  for (const pet of attacker) {
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === "start-of-battle") {
      jobs.push({ pet, team: attacker, enemyTeam: defender, ability });
    }
  }
  for (const pet of defender) {
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === "start-of-battle") {
      jobs.push({ pet, team: defender, enemyTeam: attacker, ability });
    }
  }

  for (const { pet, team, enemyTeam, ability } of orderByAttack(jobs, (j) => j.pet.attack)) {
    const index = team.indexOf(pet);
    if (index === -1) continue; // fainted earlier in this same phase
    const summon = (p: PetInstance, afterIndex: number) => {
      if (team.length < 5) {
        const insertAt = Math.min(afterIndex, team.length);
        team.splice(insertAt, 0, p);
        fireFriendSummoned(team, insertAt, enemyTeam, petRegistry, counts);
      }
    };
    fireAbilityOn(ability, pet, index, team, enemyTeam, petRegistry, counts, summon);
  }
}

// Fires a single pet's ability if it matches `trigger` (before-attack /
// knock-out — neither summons). `pet` is passed by reference rather than
// resolved from `team[index]` internally, since a knock-out's scorer may
// already have been removed from `team` by a simultaneous mutual-kill.
function fireSingleTrigger(
  trigger: "before-attack" | "knock-out",
  pet: PetInstance,
  index: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: WeakMap<PetInstance, number>
): void {
  const def = petRegistry[pet.type];
  if (def?.ability?.trigger !== trigger) return;
  fireAbilityOn(def.ability, pet, index, team, enemyTeam, petRegistry, counts, () => {});
}

export function simulateBattle(
  playerTeam: (PetInstance | null)[],
  opponentTeam: (PetInstance | null)[],
  petRegistry: Record<string, PetType> = {}
): BattleSimulationResult {
  let attacker: PetInstance[] = compactTeam(playerTeam);
  let defender: PetInstance[] = compactTeam(opponentTeam);
  const steps: BattleStep[] = [];
  const triggerCounts = new WeakMap<PetInstance, number>();

  steps.push({
    attackerTeam: attacker.map(clonePet),
    defenderTeam: defender.map(clonePet),
    description: "Battle start",
  });

  // Start-of-battle abilities fire across both teams, highest attack first
  fireStartOfBattlePhase(attacker, defender, petRegistry, triggerCounts);
  handleDeathsPhase(attacker, defender, petRegistry, triggerCounts);

  let rounds = 0;
  const MAX_ROUNDS = 50;

  while (attacker.length > 0 && defender.length > 0 && rounds < MAX_ROUNDS) {
    rounds++;
    const atkFront = attacker[0];
    const defFront = defender[0];

    const beforeAttackOrder = orderByAttack(
      [
        { pet: atkFront, team: attacker, enemyTeam: defender },
        { pet: defFront, team: defender, enemyTeam: attacker },
      ],
      (j) => j.pet.attack
    );
    for (const { pet, team, enemyTeam } of beforeAttackOrder) {
      fireSingleTrigger("before-attack", pet, 0, team, enemyTeam, petRegistry, triggerCounts);
    }

    const description = `${atkFront.type} (${atkFront.attack}/${atkFront.health}) attacks ${defFront.type} (${defFront.attack}/${defFront.health})`;

    const dmgToDefender = applyPerkDamage(defFront, atkFront.attack);
    const dmgToAttacker = applyPerkDamage(atkFront, defFront.attack);
    defFront.health -= dmgToDefender;
    atkFront.health -= dmgToAttacker;

    // Peanut: any hit dealing damage post-mitigation is lethal (a full Melon
    // block doesn't count as a hit).
    if (atkFront.perk === "Peanut" && dmgToDefender > 0) {
      defFront.health = Math.min(defFront.health, 0);
    }
    if (defFront.perk === "Peanut" && dmgToAttacker > 0) {
      atkFront.health = Math.min(atkFront.health, 0);
    }

    const defenderDied = defFront.health <= 0;
    const attackerDied = atkFront.health <= 0;

    // Faint runs first (highest attack first on a mutual kill) so a
    // knock-out ability like Rhino's sees the new front, not the pet that
    // just died.
    handleDeathsPhase(attacker, defender, petRegistry, triggerCounts);

    const knockoutOrder = orderByAttack(
      [
        ...(defenderDied ? [{ pet: atkFront, team: attacker, enemyTeam: defender }] : []),
        ...(attackerDied ? [{ pet: defFront, team: defender, enemyTeam: attacker }] : []),
      ],
      (j) => j.pet.attack
    );
    for (const { pet, team, enemyTeam } of knockoutOrder) {
      fireSingleTrigger("knock-out", pet, team.indexOf(pet), team, enemyTeam, petRegistry, triggerCounts);
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
