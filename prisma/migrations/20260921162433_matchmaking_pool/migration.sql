-- AlterTable: add opponentName to Battle
ALTER TABLE "Battle" ADD COLUMN "opponentName" TEXT;

-- CreateTable
CREATE TABLE "SubmittedTeam" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "lives" INTEGER NOT NULL,
    "trophies" INTEGER NOT NULL,
    "team" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmittedTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubmittedTeam_turnNumber_lives_trophies_idx" ON "SubmittedTeam"("turnNumber", "lives", "trophies");

-- CreateIndex
CREATE INDEX "SubmittedTeam_playerId_idx" ON "SubmittedTeam"("playerId");

-- EnableRLS
ALTER TABLE "SubmittedTeam" ENABLE ROW LEVEL SECURITY;
