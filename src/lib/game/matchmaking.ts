import { StaticPack, type Pack } from "@/lib/game/pack";

// Same values as the PackKind and MatchmakingMode enums in prisma/schema.prisma,
// which the client can't import.
export enum PackKind {
  Static = "STATIC",
  Custom = "CUSTOM",
}

export enum MatchmakingMode {
  SamePack = "SAME_PACK",
  AllPacks = "ALL_PACKS",
}

// Server actions get their arguments from the client, so they're checked.
export function isMatchmakingMode(value: unknown): value is MatchmakingMode {
  return Object.values(MatchmakingMode).includes(value as MatchmakingMode);
}

export function getPackKind(pack: Pack): PackKind {
  return pack instanceof StaticPack ? PackKind.Static : PackKind.Custom;
}

// TODO - Temporary, while Turtle is the only static pack: Same pack plays your
// own kind of pack, All packs plays both. Later, All packs plays any static pack,
// and custom packs always play custom packs.
export function opponentPackKinds(packKind: PackKind, matchmakingMode: MatchmakingMode): PackKind[] {
  return matchmakingMode === MatchmakingMode.SamePack ? [packKind] : [PackKind.Static, PackKind.Custom];
}
