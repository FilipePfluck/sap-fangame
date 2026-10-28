import {
  ActionType,
  BattleAction,
  BattleStep,
  PetData,
  Trigger,
} from "@/lib/types";
import { Board } from "@/lib/game/board";
import { PetInstance } from "@/lib/game/pet";
import { LOG_LEVEL, LOGGING } from "@/lib/game/rules";

const NOOP_SUMMON = () => {};

type source = {
  team: "Player" | "Enemy";
  index: number;
};

export class Battle {
  MAX_ROUNDS = 50;

  private playerTeam: Board;
  private enemyTeam: Board;
  totalRounds: number = 0;
  steps: BattleStep[] = [];
  result: "WIN" | "DRAW" | "LOSS" | undefined;

  static fromPetArray({
    playerPets,
    enemyPets,
  }: {
    playerPets: (PetData | null)[];
    enemyPets: (PetData | null)[];
  }): Battle {
    const playerTeam = new Board(playerPets);
    const enemyTeam = new Board(enemyPets);

    return new Battle({ playerTeam, enemyTeam });
  }

  constructor({
    playerTeam,
    enemyTeam,
  }: {
    playerTeam: Board;
    enemyTeam: Board;
  }) {
    this.playerTeam = playerTeam;
    this.enemyTeam = enemyTeam;
    this.simulate();
  }

  private simulate() {
    if (LOGGING == LOG_LEVEL.VERBOSE) {
      console.log("BEGIN BATTLE");
      console.log("Player:\t" + this.playerTeam.toString());
      console.log("Enemy:\t" + this.enemyTeam.toString());
    }


    this.playerTeam = this.playerTeam.moveForward();
    this.enemyTeam = this.enemyTeam.moveForward();

    this.processStartOfBattle();

    this.playerTeam.resolveFaintQueue();
    this.enemyTeam.resolveFaintQueue();

    while (this.totalRounds < this.MAX_ROUNDS) {
      // Check if battle resolved, as start of battle can resolve immediately
      this.assignResult();
      if (this.result) break;

      this.totalRounds += 1;
      if (LOGGING == LOG_LEVEL.VERBOSE) console.log(`-- ROUND ${this.totalRounds} --`);

      this.processRound();

      if (LOGGING == LOG_LEVEL.VERBOSE) this.logCurrentStep();
    }

    if (this.totalRounds == this.MAX_ROUNDS) {
      if (LOGGING == LOG_LEVEL.VERBOSE) console.log("Battle timed out");
      this.result = "DRAW";
    }
  }

  private processStartOfBattle() {
    // TODO: Implement Start of Battle handling
    this.steps.push({
      actions: [],
      round: 0,
      summary: {
        opposingTeam: this.enemyTeam.getApiBoard(),
        playerTeam: this.playerTeam.getApiBoard(),
      },
    });
  }

  private processRound() {
    this.playerTeam = this.playerTeam.moveForward();
    this.enemyTeam = this.enemyTeam.moveForward();
    const roundActions: BattleAction[] = [];

    if (this.playerTeam.get(0) === null || this.enemyTeam.get(0) === null) {
      throw new Error("Attempted to make non-existent pets attacks");
    }

    const description =
      this.playerTeam.get(0)!.toString() +
      " attacks " +
      this.enemyTeam.get(0)!.toString();

    this.playerTeam.get(0)!.logTrigger(Trigger.before_attack);
    this.enemyTeam.get(0)!.logTrigger(Trigger.before_attack);

    const result = this.playerTeam.attack(this.enemyTeam, 0, 0);

    this.playerTeam.resolveFaintQueue();
    this.enemyTeam.resolveFaintQueue();

    roundActions.push({
      type: ActionType.DirectDamage,
      description,
      sourceIndex: 0,
      sourceValue: result.dmgToPlayer,
      targetIndex: 0,
      targetValue: result.dmgToOpponent,
    });

    this.steps.push({
      round: this.totalRounds,
      summary: {
        playerTeam: this.playerTeam.getApiBoard(),
        opposingTeam: this.enemyTeam.getApiBoard(),
      },
      actions: roundActions,
    });
  }

  private assignResult() {
    this.result = undefined;
    const playerDefeated = this.playerTeam.living().length == 0;
    const enemyDefeated = this.enemyTeam.living().length == 0;

    if (playerDefeated && enemyDefeated) this.result = "DRAW";
    if (playerDefeated && !enemyDefeated) this.result = "LOSS";
    if (!playerDefeated && enemyDefeated) this.result = "WIN";
  }

  private getPet(source: source) {
    if (source.team == "Player") return this.playerTeam.get(source.index);
    if (source.team == "Enemy") return this.enemyTeam.get(source.index);
    throw new Error("Team not assigned");
  }

  private getFriend(source: source) {
    if (source.team == "Player") this.playerTeam.getFriends(source.index);
    if (source.team == "Enemy") this.enemyTeam.getFriends(source.index);
    throw new Error("Team not assigned");
  }

  private getFriendly(source: source) {
    if (source.team == "Player") return this.playerTeam.getFriendly();
    if (source.team == "Enemy") this.enemyTeam.getFriendly();
    throw new Error("Team not assigned");
  }

  private logCurrentStep() {
    console.log("-- Actions --");
    for (const action of this.steps[this.totalRounds].actions)
      console.log(action.description);
    console.log("Player:\t" + this.playerTeam.toString());
    console.log("Enemy:\t" + this.enemyTeam.toString());
    console.log("---\n");
  }
}
