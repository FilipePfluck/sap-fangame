-- CreateIndex
CREATE INDEX "Battle_gameId_idx" ON "Battle"("gameId");

-- CreateIndex
CREATE INDEX "BoardState_gameId_createdAt_idx" ON "BoardState"("gameId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Game_playerId_idx" ON "Game"("playerId");

-- CreateIndex
CREATE INDEX "GameTurn_gameId_idx" ON "GameTurn"("gameId");
