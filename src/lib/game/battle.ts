import {
  BattleAbilityContext,
  BattleStep,
  isOffensivePerk,
  isTriggerPerk,
  PetInstance,
  StaticPet,
  SummonRequest,
  Trigger,
} from "@/lib/types";
import { byCurrentAttack } from "@/lib/utils/random";
import { clonePetInstance } from "@/lib/utils/clone";
import { dealDirectDamage } from "@/lib/utils/combat";
import { compactApiBoard } from "@/lib/game/merge";
import { friendSummonedCandidates } from "@/lib/game/friend-summoned";
import { friendAheadAbility } from "@/lib/game/pet";
import { getAbility } from "@/lib/pets/ability";
import { triggerEffect } from "@/lib/perks/trigger-functions";

const MAX_TEAM_SIZE = 5;

export type BattleSimulationResult = {
  result: "WIN" | "DRAW" | "LOSS";
  steps: BattleStep[];
};

type BattleAbility = { fn: (ctx: BattleAbilityContext) => void };

// What the ability is reacting to, when it needs to know where it happened.
type AbilityEvent = Pick<
  BattleAbilityContext,
  "summonedIndex" | "faintedIndex"
>;

// A summon request, plus the teams of the pet that asked for it.
type QueuedSummon = SummonRequest & {
  team: PetInstance[];
  enemyTeam: PetInstance[];
};

function compactTeam(team: (PetInstance | null)[]): PetInstance[] {
  return compactApiBoard(team).map(clonePetInstance);
}

// Fires `ability` for `pet`, then repeats it once more at level 1 if a
// Tiger sits directly behind (skipped on the repeat itself). Any summons the
// ability asks for are appended to `summonRequests` for the caller to place;
// callers whose trigger never summons pass a throwaway array.
// TODO - Tiger support makes this function grow with every new trigger. Options:
//   - Tiger directly calls the pet ahead's ability
//   - battle.ts checks for a Tiger behind whenever any ability activates, then repeats it
//   - (worst) move as much of this as possible into helpers in tiger.ts
function fireAbilityOn(
  ability: BattleAbility,
  pet: PetInstance,
  index: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>,
  summonRequests: SummonRequest[],
  event: AbilityEvent = {},
  levelOverride?: number
): void {
  const ctx: BattleAbilityContext = {
    self: pet,
    selfIndex: index,
    team,
    enemyTeam,
    level: levelOverride ?? pet.level,
    summonRequests,
    hurtPets: [],
    ...event,
    petRegistry,
    isRepeat: levelOverride !== undefined,
  };
  ability.fn(ctx);

  // Hurt abilities wait for the ability that dealt the damage to finish, so
  // e.g. both hits of a level 2 Elephant land before a Gorilla gains Coconut.
  for (const hurtPet of byCurrentAttack(ctx.hurtPets, (hurt) => hurt.attack)) {
    const hurtTeam = team.includes(hurtPet) ? team : enemyTeam;
    const otherTeam = hurtTeam === team ? enemyTeam : team;
    fireHurt(hurtPet, hurtTeam, otherTeam, petRegistry);
  }

  // Looked up again, since the ability may have moved `pet` (e.g. Whale
  // swallowing the friend ahead).
  const currentIndex = team.indexOf(pet);
  if (
    levelOverride === undefined &&
    currentIndex >= 0 &&
    team[currentIndex + 1]?.type === "Tiger"
  ) {
    fireAbilityOn(
      ability,
      pet,
      currentIndex,
      team,
      enemyTeam,
      petRegistry,
      summonRequests,
      event,
      1
    );
  }
}

function fireFriendSummoned(
  team: PetInstance[],
  summonedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>
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
    fireAbilityOn(ability, pet, index, team, enemyTeam, petRegistry, [], {
      summonedIndex,
    });
  }
}

function fireFaintAbility(
  fainted: PetInstance,
  faintedIndex: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>,
  pendingSummons: SummonRequest[]
): void {
  const ability = getAbility(petRegistry[fainted.type], Trigger.faint);
  if (!ability) return;
  fireAbilityOn(
    ability,
    fainted,
    faintedIndex,
    team,
    enemyTeam,
    petRegistry,
    pendingSummons
  );
}

function queueFaintPerkSummon(
  fainted: PetInstance,
  faintedIndex: number,
  pendingSummons: SummonRequest[]
): void {
  if (!isTriggerPerk(fainted.perk) || fainted.perk.trigger !== Trigger.faint)
    return;
  const { summonRequest } = triggerEffect(fainted.perk, { self: fainted });
  if (summonRequest)
    pendingSummons.push({ pet: summonRequest, afterIndex: faintedIndex });
}

function queueSummons(
  requests: SummonRequest[],
  team: PetInstance[],
  enemyTeam: PetInstance[]
): QueuedSummon[] {
  return requests.map((request) => ({ ...request, team, enemyTeam }));
}

// Places each summon on its team. With no room left, a summon is flung —
// unless it waits for space, in which case it is returned to try again later.
function placeSummons(
  summons: QueuedSummon[],
  petRegistry: Record<string, StaticPet>
): QueuedSummon[] {
  const insertionsAt = new Map<PetInstance[], Map<number, number>>();
  const stillWaiting: QueuedSummon[] = [];
  for (const summon of summons) {
    const team = summon.onEnemyTeam ? summon.enemyTeam : summon.team;
    const enemyTeam = summon.onEnemyTeam ? summon.team : summon.enemyTeam;
    if (team.length >= MAX_TEAM_SIZE) {
      if (summon.waitsForSpace) stillWaiting.push(summon);
      continue;
    }

    const afterIndex = summon.onEnemyTeam ? 0 : summon.afterIndex;
    const teamInsertions = insertionsAt.get(team) ?? new Map<number, number>();
    insertionsAt.set(team, teamInsertions);
    const offset = teamInsertions.get(afterIndex) ?? 0;
    teamInsertions.set(afterIndex, offset + 1);
    const insertAt = Math.min(afterIndex + offset, team.length);
    team.splice(insertAt, 0, summon.pet);
    if (!summon.skipsFriendSummoned) {
      fireFriendSummoned(team, insertAt, enemyTeam, petRegistry);
    }
  }
  return stillWaiting;
}

// Fires "friend faints" for the fainted pet's living friends (highest attack
// first) and returns what they asked to summon. Those summons wait for space:
// the fainted pet's own summons are placed first and may fill the team.
function fireFriendFaints(
  fainted: PetInstance,
  faintedIndex: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>
): SummonRequest[] {
  const notActivated = petRegistry[fainted.type]?.doesNotActivatePet ?? [];
  const listeners = team.flatMap((friend) => {
    if (friend === fainted || friend.health <= 0) return [];
    if (notActivated.includes(friend.type)) return [];
    const ability = getAbility(petRegistry[friend.type], Trigger.friend_faints);
    return ability ? [{ friend, ability }] : [];
  });

  const summonRequests: SummonRequest[] = [];
  for (const { friend, ability } of byCurrentAttack(
    listeners,
    (listener) => listener.friend.attack
  )) {
    const index = team.indexOf(friend);
    if (index === -1) continue;
    fireAbilityOn(
      ability,
      friend,
      index,
      team,
      enemyTeam,
      petRegistry,
      summonRequests,
      { faintedIndex }
    );
  }
  return summonRequests.map((request) => ({ ...request, waitsForSpace: true }));
}

function fireFriendAheadFaints(
  faintedIndex: number,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>
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
    []
  );
}

function handleFaint(
  team: PetInstance[],
  faintedIndex: number,
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>,
  waitingSummons: QueuedSummon[]
): void {
  const fainted = team[faintedIndex];
  const pendingSummons: SummonRequest[] = [];
  fireFaintAbility(
    fainted,
    faintedIndex,
    team,
    enemyTeam,
    petRegistry,
    pendingSummons
  );
  queueFaintPerkSummon(fainted, faintedIndex, pendingSummons);
  fireFriendAheadFaints(faintedIndex, team, enemyTeam, petRegistry);
  const friendFaintSummons = fireFriendFaints(
    fainted,
    faintedIndex,
    team,
    enemyTeam,
    petRegistry
  );
  team.splice(faintedIndex, 1);

  // The fainted pet's own summons land first; summons still waiting from
  // earlier faints and from friends reacting to this one take what room is left.
  const ownWaiting = placeSummons(
    queueSummons(pendingSummons, team, enemyTeam),
    petRegistry
  );
  const waiting = [
    ...waitingSummons.splice(0),
    ...queueSummons(friendFaintSummons, team, enemyTeam),
    ...ownWaiting,
  ];
  waitingSummons.push(...placeSummons(waiting, petRegistry));
}

// Routes deaths through handleFaint (not a bare splice) so faint abilities
// still fire. Pets on both teams that died simultaneously (e.g. a mutual
// front-line kill, or several felled by the same start-of-battle phase) are
// pooled and faint highest-attack-first, per the ability-order spec, rather
// than one team draining fully before the other.
function handleDeathsPhase(
  attacker: PetInstance[],
  defender: PetInstance[],
  petRegistry: Record<string, StaticPet>,
  waitingSummons: QueuedSummon[]
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
    handleFaint(team, index, enemyTeam, petRegistry, waitingSummons);
  }
}

// Fires "start-of-battle" across BOTH teams as one combined, highest-attack-
// first phase (ties random) — not one team draining entirely before the
// other, per the ability-order spec.
function fireStartOfBattlePhase(
  attacker: PetInstance[],
  defender: PetInstance[],
  petRegistry: Record<string, StaticPet>,
  waitingSummons: QueuedSummon[]
): void {
  type Job = {
    pet: PetInstance;
    team: PetInstance[];
    enemyTeam: PetInstance[];
    ability: BattleAbility;
  };
  const jobs: Job[] = [];
  for (const pet of attacker) {
    const ability = getAbility(petRegistry[pet.type], Trigger.start_of_battle);
    if (ability) {
      jobs.push({ pet, team: attacker, enemyTeam: defender, ability });
    }
  }
  for (const pet of defender) {
    const ability = getAbility(petRegistry[pet.type], Trigger.start_of_battle);
    if (ability) {
      jobs.push({ pet, team: defender, enemyTeam: attacker, ability });
    }
  }

  for (const { pet, team, enemyTeam, ability } of byCurrentAttack(
    jobs,
    (j) => j.pet.attack
  )) {
    const index = team.indexOf(pet);
    if (index === -1) continue;
    const summonRequests: SummonRequest[] = [];
    fireAbilityOn(
      ability,
      pet,
      index,
      team,
      enemyTeam,
      petRegistry,
      summonRequests
    );
    waitingSummons.push(
      ...placeSummons(
        queueSummons(summonRequests, team, enemyTeam),
        petRegistry
      )
    );
  }
}

// Fires `pet`'s "hurt" ability, then "friend hurt" for its living friends
// (highest attack first).
function fireHurt(
  pet: PetInstance,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>
): void {
  fireSingleTrigger(
    Trigger.hurt,
    pet,
    team.indexOf(pet),
    team,
    enemyTeam,
    petRegistry
  );

  const listeners = team.flatMap((friend) => {
    if (friend === pet || friend.health <= 0) return [];
    const ability = getAbility(petRegistry[friend.type], Trigger.friend_hurt);
    return ability ? [{ friend, ability }] : [];
  });
  for (const { friend, ability } of byCurrentAttack(
    listeners,
    (listener) => listener.friend.attack
  )) {
    const index = team.indexOf(friend);
    if (index === -1) continue;
    fireAbilityOn(ability, friend, index, team, enemyTeam, petRegistry, []);
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
  petRegistry: Record<string, StaticPet>
): void {
  const ability = getAbility(petRegistry[pet.type], trigger);
  if (!ability) return;
  fireAbilityOn(ability, pet, index, team, enemyTeam, petRegistry, []);
}

// Fires `pet`'s after-attack perk (Chili), then "hurt" for a pet it damaged.
function fireAfterAttackPerk(
  pet: PetInstance,
  team: PetInstance[],
  enemyTeam: PetInstance[],
  petRegistry: Record<string, StaticPet>
): void {
  if (!isTriggerPerk(pet.perk) || pet.perk.trigger !== Trigger.after_attack)
    return;
  const { hurtPet } = triggerEffect(pet.perk, { self: pet, enemyTeam });
  if (hurtPet) fireHurt(hurtPet, enemyTeam, team, petRegistry);
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
  petRegistry: Record<string, StaticPet>
): FriendAheadJob[] {
  const candidates: FriendAheadJob[] = [];

  for (const { attackingPet, team, enemyTeam } of attacks) {
    const attackerIndex = team.indexOf(attackingPet);
    if (attackerIndex === -1) continue;
    const pet = team[attackerIndex + 1];
    const fn = friendAheadAbility(
      pet,
      Trigger.friend_ahead_attacks,
      petRegistry
    );
    if (fn) candidates.push({ pet, team, enemyTeam, ability: { fn } });
  }
  return candidates;
}

function fireFriendAheadAttacks(
  candidates: FriendAheadJob[],
  petRegistry: Record<string, StaticPet>
): void {
  for (const { pet, team, enemyTeam, ability } of byCurrentAttack(
    candidates,
    (candidate) => candidate.pet.attack
  )) {
    const index = team.indexOf(pet);
    if (index === -1) continue;
    fireAbilityOn(ability, pet, index, team, enemyTeam, petRegistry, []);
  }
}

export function simulateBattle(
  playerTeam: (PetInstance | null)[],
  opponentTeam: (PetInstance | null)[],
  petRegistry: Record<string, StaticPet> = {}
): BattleSimulationResult {
  const attacker: PetInstance[] = compactTeam(playerTeam);
  const defender: PetInstance[] = compactTeam(opponentTeam);
  const steps: BattleStep[] = [];
  const waitingSummons: QueuedSummon[] = [];

  steps.push({
    attackerTeam: attacker.map(clonePetInstance),
    defenderTeam: defender.map(clonePetInstance),
    description: "Battle start",
  });

  // Start-of-battle abilities fire across both teams, highest attack first
  fireStartOfBattlePhase(attacker, defender, petRegistry, waitingSummons);
  handleDeathsPhase(attacker, defender, petRegistry, waitingSummons);

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
        petRegistry
      );
    }

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

    fireAfterAttackPerk(atkFront, attacker, defender, petRegistry);
    fireAfterAttackPerk(defFront, defender, attacker, petRegistry);

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
        petRegistry
      );
    }

    fireFriendAheadAttacks(friendAheadQueue, petRegistry);

    const hurtOrder = byCurrentAttack(
      [
        ...(defFront.health < defenderHealthBefore
          ? [{ pet: defFront, team: defender, enemyTeam: attacker }]
          : []),
        ...(atkFront.health < attackerHealthBefore
          ? [{ pet: atkFront, team: attacker, enemyTeam: defender }]
          : []),
      ],
      (job) => job.pet.attack
    );
    for (const { pet, team, enemyTeam } of hurtOrder) {
      fireHurt(pet, team, enemyTeam, petRegistry);
    }

    const defenderDied = defFront.health <= 0;
    const attackerDied = atkFront.health <= 0;

    // Faint runs first (highest attack first on a mutual kill) so a
    // knock-out ability like Rhino's sees the new front, not the pet that
    // just died.
    handleDeathsPhase(attacker, defender, petRegistry, waitingSummons);

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
        petRegistry
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
