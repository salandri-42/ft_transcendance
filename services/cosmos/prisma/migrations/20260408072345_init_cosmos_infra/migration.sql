-- CreateTable
CREATE TABLE "Star" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "z" DOUBLE PRECISION NOT NULL,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Star_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL DEFAULT 'drawing',
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "imageData" BYTEA NOT NULL,
    "imageSize" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "ownerId" TEXT NOT NULL,
    "starId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Star_ownerId_idx" ON "Star"("ownerId");

-- CreateIndex
CREATE INDEX "Artwork_ownerId_idx" ON "Artwork"("ownerId");

-- CreateIndex
CREATE INDEX "Artwork_starId_idx" ON "Artwork"("starId");

-- AddForeignKey
ALTER TABLE "Artwork" ADD CONSTRAINT "Artwork_starId_fkey" FOREIGN KEY ("starId") REFERENCES "Star"("id") ON DELETE CASCADE ON UPDATE CASCADE;
