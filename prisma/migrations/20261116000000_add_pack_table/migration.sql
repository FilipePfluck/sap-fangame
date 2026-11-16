-- CreateTable
CREATE TABLE "Pack" (
    "id" SERIAL NOT NULL,
    "petsId" INTEGER[],
    "foodsId" INTEGER[],
    "name" TEXT NOT NULL,
    "iconId" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pack_ownerId_idx" ON "Pack"("ownerId");

-- AddForeignKey
ALTER TABLE "Pack" ADD CONSTRAINT "Pack_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRLS
ALTER TABLE "Pack" ENABLE ROW LEVEL SECURITY;
