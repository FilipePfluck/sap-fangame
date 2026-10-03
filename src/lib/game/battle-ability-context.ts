import type {
  AbilityStateKey,
  AbilityState,
  BattleAbilityContext,
  PetInstance,
} from "@/lib/types";

type BattleAbilityContextOptions = Omit<
  BattleAbilityContext,
  "resolveValue" | "modifyStats" | "swallowFriendAhead"
>;

export class AbilityStateStore {
  private readonly stateByPet = new WeakMap<PetInstance, Map<AbilityStateKey, unknown>>();

  private stateFor(pet: PetInstance): Map<AbilityStateKey, unknown> {
    let state = this.stateByPet.get(pet);
    if (!state) {
      state = new Map();
      this.stateByPet.set(pet, state);
    }
    return state;
  }

  forPet(pet: PetInstance): AbilityState {
    const state = this.stateFor(pet);

    return {
      get: <T>(key: AbilityStateKey) => state.get(key) as T | undefined,
      set: (key, value) => state.set(key, value),
    };
  }

  reached(pet: PetInstance, key: AbilityStateKey, every: number): boolean {
    if (every <= 0) return false;
    const state = this.stateFor(pet);
    const next = ((state.get(key) as number | undefined) ?? 0) + 1;
    state.set(key, next < every ? next : 0);
    return next >= every;
  }
}

export function createBattleAbilityContext(
  options: BattleAbilityContextOptions
): BattleAbilityContext {
  return {
    ...options,
    resolveValue: (values) => values[options.mode],
    modifyStats: (target, changes) => {
      const attack = changes.attack ?? 0;
      const health = changes.health ?? 0;
      target.attack += attack;
      target.health += health;

      if (options.mode === "shop") {
        if (attack !== 0) target.tempAttack = (target.tempAttack ?? 0) + attack;
        if (health !== 0) target.tempHealth = (target.tempHealth ?? 0) + health;
      }
    },
    swallowFriendAhead: () => {
      const selfIndex = options.team.indexOf(options.self);
      for (let index = selfIndex - 1; index >= 0; index--) {
        const friend = options.team[index];
        if (friend.health <= 0) continue;
        options.team.splice(index, 1);
        return { type: friend.type, attack: friend.attack, health: friend.health };
      }
      return undefined;
    },
  };
}