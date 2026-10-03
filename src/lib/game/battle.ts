import {
  BattleAbilityContext,
  BattleStep,
  Board,
  isOffensivePerk,
  isTriggerPerk,
  PetInstance,
  PetType,
  SummonOptions,
  Trigger,
} from "@/lib/types";
import { clonePetInstance } from "@/lib/utils/clone";
import { byCurrentAttack } from "@/lib/utils/random";
import { dealAbilityDamage, dealDirectDamage } from "@/lib/utils/combat";
import { compactBoard, grantExperience } from "@/lib/game/merge";
import { friendSummonedCandidates } from "@/lib/game/friend-summoned";
import { friendAheadAbility } from "@/lib/game/pet";
import { triggerEffect } from "@/lib/perks/trigger-functions";
import { triggerFriendAteFood } from "@/lib/game/food";

type HurtJob = {
  pet: PetInstance;
  team: PetInstance[];
  enemyTeam: PetInstance[];
};
type TriggerState = {
  counts: WeakMap<PetInstance, number>;
  pendingHurt: HurtJob[];
  pendingSummons: PendingSummon[];
};

const MAX_TEAM_SIZE = 5;
const NOOP_SUMMON = () => {};

export type BattleSimulationResult = {
  result: "WIN" | "DRAW" | "LOSS";
  steps: BattleStep[];
};

type BattleAbility = { fn: (ctx: BattleAbilityContext) => void };

function compactTeam(team: Board): PetInstance[] {
  return compactBoard(team).map(clonePetInstance);
}

function nextTriggerCount(
  counts: TriggerState,
  pet: PetInstance
): number {
  const next = (counts.counts.get(pet) ?? 0) + 1;
  counts.counts.set(pet, next);
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
  counts: TriggerState,
  summon: (pet: PetInstance, afterIndex: number, options?: SummonOptions) => void,
  summonedIndex?: number,
  levelOverride?: number,
  faintedIndex?: number
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
    faintedIndex,
    triggerCount,
    petRegistry,
    dealAbilityDamage: (target, damage) => {
      if (target.health <= 0) return 0;
      const healthBefore = target.health;
      const dealt = dealAbilityDamage(target, damage);
      if (target.health < healthBefore) {
        const targetTeam = team.includes(target) ? team : enemyTeam;
        const otherTeam = targetTeam === team ? enemyTeam : team;
        counts.pendingHurt.push({
          pet: target,
          team: targetTeam,
          enemyTeam: otherTeam,
        });
      }
      return dealt;
    },
    grantExperience,
    friendAteFood: (fedPet) =>
      triggerFriendAteFood(team, fedPet, petRegistry),
  };
  ability.fn(ctx);

  if (
    levelOverride === undefined &&
    index >= 0 &&
    team[index + 1]?.type === "Tiger"
  ) {
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
      1,
      faintedIndex
    );
  }
}

function fireFriendSummoned(
  team: PetInstance[],
  summonedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  const candidates = friendSummonedCandidates(team, summonedIndex, petRegistry);

  // Same-trigger pets fire highest-attack first (ties random) per the
  // ability-order spec, rather than in raw board order.
  for (const { pet, ability } of byCurrentAttack(
    candidates,
    (c) => c.pet.attack
  )) {
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
      NOOP_SUMMON,
      summonedIndex
    );
  }
}

type SummonRequest = {
  pet: PetInstance;
  afterIndex: number;
  options?: SummonOptions;
};
type PendingSummon = SummonRequest & {
  team: PetInstance[];
  enemyTeam: PetInstance[];
};

function fireFaintAbility(
  fainted: PetInstance,
  faintedIndex: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState,
  pendingSummons: SummonRequest[]
): void {
  const ability = petRegistry[fainted.type]?.ability;
  if (ability?.trigger !== Trigger.faint) return;
  fireAbilityOn(
    ability,
    fainted,
    faintedIndex,
    team,
    enemyTeam,
    petRegistry,
    counts,
    (pet, afterIndex, options) => pendingSummons.push({ pet, afterIndex, options }),
    undefined,
    undefined,
    faintedIndex
  );
}

function queueFaintPerkSummon(
  fainted: PetInstance,
  faintedIndex: number,
  pendingSummons: SummonRequest[]
): void {
  if (!isTriggerPerk(fainted.perk) || fainted.perk.trigger !== Trigger.faint) return;
  const { summonRequest } = triggerEffect(fainted.perk, { self: fainted });
  if (summonRequest) pendingSummons.push({ pet: summonRequest, afterIndex: faintedIndex });
}

// Summons with no room left on the team are flung.
function insertSummonRequests(
  pendingSummons: PendingSummon[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  const insertionsAt = new Map<PetInstance[], Map<number, number>>();
  const deferred: PendingSummon[] = [];
  for (const request of pendingSummons) {
    const { pet, afterIndex, team, enemyTeam, options } = request;
    if (team.length >= MAX_TEAM_SIZE) {
      if (options?.waitForSpace) deferred.push(request);
      continue;
    }
    let teamInsertions = insertionsAt.get(team);
    if (!teamInsertions) {
      teamInsertions = new Map<number, number>();
      insertionsAt.set(team, teamInsertions);
    }
    const offset = teamInsertions.get(afterIndex) ?? 0;
    const insertAt = options?.side === "enemy"
      ? Math.min(offset, team.length)
      : Math.min(afterIndex + offset, team.length);
    teamInsertions.set(afterIndex, offset + 1);
    team.splice(insertAt, 0, pet);
    if (options?.triggerFriendSummoned !== false) {
      fireFriendSummoned(team, insertAt, enemyTeam, petRegistry, counts);
    }
  }
  counts.pendingSummons.push(...deferred);
}

function insertSummons(
  team: PetInstance[],
  pendingSummons: SummonRequest[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  insertSummonRequests(
    pendingSummons.map((request) => ({
      ...request,
      team: request.options?.side === "enemy" ? enemyTeam : team,
      enemyTeam: request.options?.side === "enemy" ? team : enemyTeam,
    })),
    petRegistry,
    counts
  );
}

function flushDeferredSummons(
  counts: TriggerState,
  petRegistry: Record<string, PetType>
): void {
  if (counts.pendingSummons.length === 0) return;
  const pending = counts.pendingSummons.splice(0);
  insertSummonRequests(pending, petRegistry, counts);
}

function fireFriendFaints(
  fainted: PetInstance,
  faintedIndex: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  if (petRegistry[fainted.type]?.ignoreFriendFaints) return;
  const candidates = team.flatMap((pet) => {
    if (pet === fainted || pet.health <= 0) return [];
    const ability = petRegistry[pet.type]?.ability;
    return ability?.trigger === Trigger.friend_faints ? [{ pet, ability }] : [];
  });

  for (const { pet, ability } of byCurrentAttack(candidates, (candidate) => candidate.pet.attack)) {
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
      (summonedPet, afterIndex, options) =>
        counts.pendingSummons.push({
          pet: summonedPet,
          afterIndex,
          team,
          enemyTeam,
          options: { ...options, waitForSpace: true },
        }),
      undefined,
      undefined,
      faintedIndex
    );
  }
}

function fireFriendAheadFaints(
  faintedIndex: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  const pet = team[faintedIndex + 1];
  const fn = friendAheadAbility(pet, Trigger.friend_ahead_faints, petRegistry);
  if (!fn) return;
  fireAbilityOn(
    { fn },
    pet,
    faintedIndex + 1,
    team,
    enemyTeam,
    petRegistry,
    counts,
    NOOP_SUMMON
  );
}

function handleFaint(
  team: PetInstance[],
  faintedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  const fainted = team[faintedIndex];
  const pendingSummons: SummonRequest[] = [];
  fireFaintAbility(fainted, faintedIndex, team, enemyTeam, petRegistry, counts, pendingSummons);
  queueFaintPerkSummon(fainted, faintedIndex, pendingSummons);
  fireFriendAheadFaints(faintedIndex, team, enemyTeam, petRegistry, counts);
  fireFriendFaints(fainted, faintedIndex, team, enemyTeam, petRegistry, counts);
  team.splice(faintedIndex, 1);
  insertSummons(team, pendingSummons, enemyTeam, petRegistry, counts);
  flushDeferredSummons(counts, petRegistry);
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
  counts: TriggerState
): void {
  type DeadJob = {
    pet: PetInstance;
    team: PetInstance[];
    enemyTeam: PetInstance[];
  };
  const dead: DeadJob[] = [];
  for (const pet of attacker) {
    if (pet.health <= 0)
      dead.push({ pet, team: attacker, enemyTeam: defender });
  }
  for (const pet of defender) {
    if (pet.health <= 0)
      dead.push({ pet, team: defender, enemyTeam: attacker });
  }

  for (const { pet, team, enemyTeam } of byCurrentAttack(
    dead,
    (d) => d.pet.attack
  )) {
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
  counts: TriggerState
): void {
  type Job = {
    pet: PetInstance;
    team: PetInstance[];
    enemyTeam: PetInstance[];
    ability: BattleAbility;
  };
  const jobs: Job[] = [];
  for (const pet of attacker) {
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === Trigger.start_of_battle) {
      jobs.push({ pet, team: attacker, enemyTeam: defender, ability });
    }
  }
  for (const pet of defender) {
    const ability = petRegistry[pet.type]?.ability;
    if (ability?.trigger === Trigger.start_of_battle) {
      jobs.push({ pet, team: defender, enemyTeam: attacker, ability });
    }
  }

  for (const { pet, team, enemyTeam, ability } of byCurrentAttack(
    jobs,
    (j) => j.pet.attack
  )) {
    const index = team.indexOf(pet);
    if (index === -1) continue;
    const summon = (p: PetInstance, afterIndex: number, options?: SummonOptions) =>
      insertSummons(team, [{ pet: p, afterIndex, options }], enemyTeam, petRegistry, counts);
    fireAbilityOn(
      ability,
      pet,
      index,
      team,
      enemyTeam,
      petRegistry,
      counts,
      summon
    );
  }
}

// Fires a single pet's ability if it matches `trigger` (attack triggers /
// knock-out — neither summons). `pet` is passed by reference rather than
// resolved from `team[index]` internally, since a knock-out's scorer may
// already have been removed from `team` by a simultaneous mutual-kill.
function fireSingleTrigger(
  trigger:
    | Trigger.before_attack
    | Trigger.after_attack
    | Trigger.hurt
    | Trigger.knock_out,
  pet: PetInstance,
  index: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  const def = petRegistry[pet.type];
  if (def?.ability?.trigger !== trigger) return;
  fireAbilityOn(
    def.ability,
    pet,
    index,
    team,
    enemyTeam,
    petRegistry,
    counts,
    NOOP_SUMMON
  );
}

function flushHurtTriggers(
  counts: TriggerState,
  petRegistry: Record<string, PetType>
): void {
  while (counts.pendingHurt.length > 0) {
    const pending = counts.pendingHurt.splice(0);
    for (const { pet, team, enemyTeam } of byCurrentAttack(
      pending,
      (job) => job.pet.attack
    )) {
      fireSingleTrigger(
        Trigger.hurt,
        pet,
        team.indexOf(pet),
        team,
        enemyTeam,
        petRegistry,
        counts
      );
    }
  }
}

function resolveDeathsAndHurt(
  attacker: PetInstance[],
  defender: PetInstance[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  while (true) {
    handleDeathsPhase(attacker, defender, petRegistry, counts);
    if (counts.pendingHurt.length === 0) return;
    flushHurtTriggers(counts, petRegistry);
  }
}

function applyChili(
  pet: PetInstance,
  team: PetInstance[],
  enemyTeam: PetInstance[]
) {
  if (pet.perk?.name !== "Chili") return null;

  const target = enemyTeam[1];
  if (!target || target.health <= 0) return null;
  const healthBefore = target.health;
  dealAbilityDamage(target, 5);
  return target.health < healthBefore
    ? { pet: target, team: enemyTeam, enemyTeam: team }
    : null;
}

type FriendAheadJob = {
  pet: PetInstance;
  team: PetInstance[];
  enemyTeam: PetInstance[];
  ability: BattleAbility;
};

function queueFriendAheadAttacks(
  attacks: {
    attackingPet: PetInstance;
    team: PetInstance[];
    enemyTeam: PetInstance[];
  }[],
  petRegistry: Record<string, PetType>
): FriendAheadJob[] {
  const candidates: FriendAheadJob[] = [];

  for (const { attackingPet, team, enemyTeam } of attacks) {
    const attackerIndex = team.indexOf(attackingPet);
    if (attackerIndex === -1) continue;
    const pet = team[attackerIndex + 1];
    const fn = friendAheadAbility(pet, Trigger.friend_ahead_attacks, petRegistry);
    if (fn) candidates.push({ pet, team, enemyTeam, ability: { fn } });
  }
  return candidates;
}

function fireFriendAheadAttacks(
  candidates: FriendAheadJob[],
  petRegistry: Record<string, PetType>,
  counts: TriggerState
): void {
  for (const { pet, team, enemyTeam, ability } of byCurrentAttack(
    candidates,
    (candidate) => candidate.pet.attack
  )) {
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
      NOOP_SUMMON
    );
  }
}

export function simulateBattle(
  playerTeam: Board,
  opponentTeam: Board,
  petRegistry: Record<string, PetType> = {}
): BattleSimulationResult {
  const attacker: PetInstance[] = compactTeam(playerTeam);
  const defender: PetInstance[] = compactTeam(opponentTeam);
  const steps: BattleStep[] = [];
  const triggerCounts: TriggerState = {
    counts: new WeakMap<PetInstance, number>(),
    pendingHurt: [],
    pendingSummons: [],
  };

  steps.push({
    attackerTeam: attacker.map(clonePetInstance),
    defenderTeam: defender.map(clonePetInstance),
    description: "Battle start",
  });

  // Start-of-battle abilities fire across both teams, highest attack first
  fireStartOfBattlePhase(attacker, defender, petRegistry, triggerCounts);
  flushHurtTriggers(triggerCounts, petRegistry);
  resolveDeathsAndHurt(attacker, defender, petRegistry, triggerCounts);

  let rounds = 0;
  const MAX_ROUNDS = 50;

  while (attacker.length > 0 && defender.length > 0 && rounds < MAX_ROUNDS) {
    rounds++;
    const atkFront = attacker[0];
    const defFront = defender[0];

    const beforeAttackOrder = byCurrentAttack(
      [
        { pet: atkFront, team: attacker, enemyTeam: defender },
        { pet: defFront, team: defender, enemyTeam: attacker },
      ],
      (j) => j.pet.attack
    );
    for (const { pet, team, enemyTeam } of beforeAttackOrder) {
      fireSingleTrigger(
        Trigger.before_attack,
        pet,
        0,
        team,
        enemyTeam,
        petRegistry,
        triggerCounts
      );
    }
    flushHurtTriggers(triggerCounts, petRegistry);

    const description = `${atkFront.type} (${atkFront.attack}/${atkFront.health}) attacks ${defFront.type} (${defFront.attack}/${defFront.health})`;

    const defenderHealthBefore = defFront.health;
    const attackerHealthBefore = atkFront.health;
    const dmgToDefender = dealDirectDamage(atkFront, defFront);
    const dmgToAttacker = dealDirectDamage(defFront, atkFront);

    // Peanut only affects normal front-line attacks, not ability damage: any
    // hit dealing damage post-mitigation is lethal (a full Melon block
    // doesn't count as a hit).
    if (
      isOffensivePerk(atkFront.perk) &&
      atkFront.perk.instantKill &&
      dmgToDefender > 0
    ) {
      defFront.health = Math.min(defFront.health, 0);
    }

    if (
      isOffensivePerk(defFront.perk) &&
      defFront.perk.instantKill &&
      dmgToAttacker > 0
    ) {
      atkFront.health = Math.min(atkFront.health, 0);
    }

    const chiliHits = [
      applyChili(atkFront, attacker, defender),
      applyChili(defFront, defender, attacker),
    ].filter((hit) => hit !== null);

    // Queued before after-attack abilities so a pet they faint still reacts.
    const friendAheadQueue = queueFriendAheadAttacks(
      [
        { attackingPet: atkFront, team: attacker, enemyTeam: defender },
        { attackingPet: defFront, team: defender, enemyTeam: attacker },
      ],
      petRegistry
    );

    const afterAttackOrder = byCurrentAttack(
      [
        { pet: atkFront, team: attacker, enemyTeam: defender },
        { pet: defFront, team: defender, enemyTeam: attacker },
      ],
      (job) => job.pet.attack
    );
    for (const { pet, team, enemyTeam } of afterAttackOrder) {
      fireSingleTrigger(
        Trigger.after_attack,
        pet,
        team.indexOf(pet),
        team,
        enemyTeam,
        petRegistry,
        triggerCounts
      );
    }

    fireFriendAheadAttacks(friendAheadQueue, petRegistry, triggerCounts);

    const hurtEvents = [
      ...chiliHits,
      ...(defFront.health < defenderHealthBefore
        ? [{ pet: defFront, team: defender, enemyTeam: attacker }]
        : []),
      ...(atkFront.health < attackerHealthBefore
        ? [{ pet: atkFront, team: attacker, enemyTeam: defender }]
        : []),
    ];
    triggerCounts.pendingHurt.push(...hurtEvents);
    flushHurtTriggers(triggerCounts, petRegistry);

    const defenderDied = defFront.health <= 0;
    const attackerDied = atkFront.health <= 0;

    // Faint runs first (highest attack first on a mutual kill) so a
    // knock-out ability like Rhino's sees the new front, not the pet that
    // just died.
    resolveDeathsAndHurt(attacker, defender, petRegistry, triggerCounts);

    const knockoutOrder = byCurrentAttack(
      [
        ...(defenderDied
          ? [{ pet: atkFront, team: attacker, enemyTeam: defender }]
          : []),
        ...(attackerDied
          ? [{ pet: defFront, team: defender, enemyTeam: attacker }]
          : []),
      ],
      (j) => j.pet.attack
    );
    for (const { pet, team, enemyTeam } of knockoutOrder) {
      fireSingleTrigger(
        Trigger.knock_out,
        pet,
        team.indexOf(pet),
        team,
        enemyTeam,
        petRegistry,
        triggerCounts
      );
    }

    steps.push({
      attackerTeam: attacker.map(clonePetInstance),
      defenderTeam: defender.map(clonePetInstance),
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
