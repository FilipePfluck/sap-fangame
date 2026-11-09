// Game-wide rules shared by the server (which enforces them) and the client
// (which displays them), so the two can't disagree.
export const STARTING_LIVES = 5;
export const TROPHIES_TO_WIN = 10;
// Gold at the start of every turn, before ability bonuses.
export const TURN_GOLD = 10;
export const MAX_PET_EXPERIENCE = 5;
export const DEFAULT_MAX_ATTACK = 50;
export const DEFAULT_MAX_HEALTH = 50;
export const MAX_PET_LEVEL = 3;
export const MAX_TIER = 6;
export const MAX_ROUNDS = 50;

export enum LOG_LEVEL {
  VERBOSE,
  WARNING,
  NONE,
}
export const LOGGING: LOG_LEVEL = LOG_LEVEL.VERBOSE;
