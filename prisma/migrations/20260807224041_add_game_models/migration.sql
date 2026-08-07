-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "BattleResult" AS ENUM ('WIN', 'DRAW', 'LOSS');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTurn" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "turnNumber" INTEGER NOT NULL,
    "lives" INTEGER NOT NULL DEFAULT 5,
    "trophies" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameTurn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardState" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "boardState" JSONB NOT NULL,
    "shopState" JSONB NOT NULL,
    "goldRemaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "opponentTeam" JSONB NOT NULL,
    "result" "BattleResult" NOT NULL,
    "steps" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTurn" ADD CONSTRAINT "GameTurn_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardState" ADD CONSTRAINT "BoardState_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardState" ADD CONSTRAINT "BoardState_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "GameTurn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
