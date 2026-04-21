-- CreateTable
CREATE TABLE "Garden" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gardenId" TEXT NOT NULL,
    "name" TEXT,
    "orientation" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "referencePhotoId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Zone_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Zone_referencePhotoId_fkey" FOREIGN KEY ("referencePhotoId") REFERENCES "Photo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Planting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gardenId" TEXT NOT NULL,
    "zoneId" TEXT,
    "catalogId" TEXT NOT NULL,
    "nickname" TEXT,
    "status" TEXT NOT NULL,
    "plantedAt" DATETIME,
    "removedAt" DATETIME,
    "positionX" REAL,
    "positionY" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planting_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Planting_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gardenId" TEXT NOT NULL,
    "zoneId" TEXT,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "takenAt" DATETIME NOT NULL,
    "caption" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhotoAnnotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "plantingId" TEXT,
    "kind" TEXT NOT NULL,
    "x" REAL NOT NULL,
    "y" REAL NOT NULL,
    "width" REAL,
    "height" REAL,
    "label" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "confidence" REAL,
    "modelVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhotoAnnotation_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PhotoAnnotation_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gardenId" TEXT NOT NULL,
    "plantingId" TEXT,
    "zoneId" TEXT,
    "photoId" TEXT,
    "entryDate" DATETIME NOT NULL,
    "note" TEXT NOT NULL,
    "harvestQuantity" REAL,
    "harvestUnit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalEntry_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "JournalEntry_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "Photo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalEntryTag" (
    "entryId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    PRIMARY KEY ("entryId", "tag"),
    CONSTRAINT "JournalEntryTag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gardenId" TEXT NOT NULL,
    "title" TEXT,
    "summary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_gardenId_fkey" FOREIGN KEY ("gardenId") REFERENCES "Garden" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationPlanting" (
    "conversationId" TEXT NOT NULL,
    "plantingId" TEXT NOT NULL,

    PRIMARY KEY ("conversationId", "plantingId"),
    CONSTRAINT "ConversationPlanting_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationPlanting_plantingId_fkey" FOREIGN KEY ("plantingId") REFERENCES "Planting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConversationZone" (
    "conversationId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,

    PRIMARY KEY ("conversationId", "zoneId"),
    CONSTRAINT "ConversationZone_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationZone_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Garden_userId_idx" ON "Garden"("userId");

-- CreateIndex
CREATE INDEX "Zone_gardenId_idx" ON "Zone"("gardenId");

-- CreateIndex
CREATE INDEX "Planting_gardenId_idx" ON "Planting"("gardenId");

-- CreateIndex
CREATE INDEX "Planting_zoneId_idx" ON "Planting"("zoneId");

-- CreateIndex
CREATE INDEX "Planting_catalogId_idx" ON "Planting"("catalogId");

-- CreateIndex
CREATE INDEX "Planting_status_idx" ON "Planting"("status");

-- CreateIndex
CREATE INDEX "Photo_gardenId_idx" ON "Photo"("gardenId");

-- CreateIndex
CREATE INDEX "Photo_zoneId_idx" ON "Photo"("zoneId");

-- CreateIndex
CREATE INDEX "Photo_takenAt_idx" ON "Photo"("takenAt");

-- CreateIndex
CREATE INDEX "PhotoAnnotation_photoId_idx" ON "PhotoAnnotation"("photoId");

-- CreateIndex
CREATE INDEX "PhotoAnnotation_plantingId_idx" ON "PhotoAnnotation"("plantingId");

-- CreateIndex
CREATE INDEX "JournalEntry_gardenId_entryDate_idx" ON "JournalEntry"("gardenId", "entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_plantingId_idx" ON "JournalEntry"("plantingId");

-- CreateIndex
CREATE INDEX "JournalEntry_zoneId_idx" ON "JournalEntry"("zoneId");

-- CreateIndex
CREATE INDEX "JournalEntryTag_tag_idx" ON "JournalEntryTag"("tag");

-- CreateIndex
CREATE INDEX "Conversation_gardenId_status_idx" ON "Conversation"("gardenId", "status");

-- CreateIndex
CREATE INDEX "ConversationPlanting_plantingId_idx" ON "ConversationPlanting"("plantingId");

-- CreateIndex
CREATE INDEX "ConversationZone_zoneId_idx" ON "ConversationZone"("zoneId");
