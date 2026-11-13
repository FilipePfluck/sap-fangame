// Game-wide rules shared by the server (which enforces them) and the client
// (which displays them), so the two can't disagree.
export const STARTING_LIVES = 5;
export const TROPHIES_TO_WIN = 10;
// Gold at the start of every turn, before ability bonuses.
export const TURN_GOLD = 10;
export const MAX_PET_EXPERIENCE = 5;
export const MAX_PET_LEVEL = 3;
export const MAX_TIER = 6;
// Tier for tokens that sit above the shop tiers; shops never reach it.
export const TOKEN_TIER = 7;
// Tag limits on a single pet (Tags spec).
export const MAX_TAGS_PER_PET = 3;
export const MAX_SUPER_TAGS_PER_PET = 3;
