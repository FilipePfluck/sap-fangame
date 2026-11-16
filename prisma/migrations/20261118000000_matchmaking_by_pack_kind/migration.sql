-- CreateEnum
CREATE TYPE "PackKind" AS ENUM ('STATIC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MatchmakingMode" AS ENUM ('SAME_PACK', 'ALL_PACKS');

-- DropIndex
DROP INDEX "SubmittedTeam_turnNumber_lives_trophies_idx";

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "matchmakingMode" "MatchmakingMode" NOT NULL DEFAULT 'SAME_PACK';

-- AlterTable
ALTER TABLE "SubmittedTeam" ADD COLUMN     "packKind" "PackKind" NOT NULL DEFAULT 'STATIC';

-- CreateIndex
CREATE INDEX "SubmittedTeam_turnNumber_packKind_lives_trophies_idx" ON "SubmittedTeam"("turnNumber", "packKind", "lives", "trophies");

