// Game-wide rules shared by the server (which enforces them) and the client
// (which displays them), so the two can't disagree.
export const STARTING_LIVES = 5;
export const TROPHIES_TO_WIN = 10;

// Gold at the start of every turn, before ability bonuses.
export const TURN_GOLD = 10;
export const MAX_PET_EXPERIENCE = 5;
export const MAX_TEAM_SIZE = 5;


export enum LOG_LEVEL {
  NONE,
  ERROR_ONLY,
  VERBOSE,
}
// Used to easily adjust console output provided
export const LOGGING: LOG_LEVEL = LOG_LEVEL.VERBOSE