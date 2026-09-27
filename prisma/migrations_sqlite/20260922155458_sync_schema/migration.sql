/*
  Warnings:

  - You are about to alter the column `details` on the `ProductIssue` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `details` on the `VariantIssue` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `updatedAt` to the `CollectionHealth` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductIssue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `VariantIssue` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "ScanJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'full',
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "errorMessage" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScanJob_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "scanJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "type" TEXT NOT NULL DEFAULT 'full',
    "healthScore" INTEGER,
    "totalProducts" INTEGER NOT NULL DEFAULT 0,
    "healthyProducts" INTEGER NOT NULL DEFAULT 0,
    "needsAttentionProducts" INTEGER NOT NULL DEFAULT 0,
    "criticalProducts" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,
    "highIssues" INTEGER NOT NULL DEFAULT 0,
    "mediumIssues" INTEGER NOT NULL DEFAULT 0,
    "lowIssues" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scan_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Scan_scanJobId_fkey" FOREIGN KEY ("scanJobId") REFERENCES "ScanJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollectionHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "collectionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CollectionHealth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionHealth_collectionId_shopId_fkey" FOREIGN KEY ("collectionId", "shopId") REFERENCES "Collection" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CollectionHealth" ("collectionId", "createdAt", "date", "id", "score", "shopId") SELECT "collectionId", "createdAt", "date", "id", "score", "shopId" FROM "CollectionHealth";
DROP TABLE "CollectionHealth";
ALTER TABLE "new_CollectionHealth" RENAME TO "CollectionHealth";
CREATE INDEX "CollectionHealth_shopId_date_idx" ON "CollectionHealth"("shopId", "date");
CREATE UNIQUE INDEX "CollectionHealth_shopId_collectionId_date_key" ON "CollectionHealth"("shopId", "collectionId", "date");
CREATE TABLE "new_ProductIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "ProductIssue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductIssue_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductIssue" ("createdAt", "details", "id", "issueId", "productId", "shopId") SELECT "createdAt", "details", "id", "issueId", "productId", "shopId" FROM "ProductIssue";
DROP TABLE "ProductIssue";
ALTER TABLE "new_ProductIssue" RENAME TO "ProductIssue";
CREATE INDEX "ProductIssue_shopId_productId_idx" ON "ProductIssue"("shopId", "productId");
CREATE INDEX "ProductIssue_shopId_issueId_idx" ON "ProductIssue"("shopId", "issueId");
CREATE UNIQUE INDEX "ProductIssue_shopId_productId_issueId_key" ON "ProductIssue"("shopId", "productId", "issueId");
CREATE TABLE "new_VariantIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "VariantIssue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariantIssue_variantId_shopId_fkey" FOREIGN KEY ("variantId", "shopId") REFERENCES "Variant" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariantIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VariantIssue" ("createdAt", "details", "id", "issueId", "shopId", "variantId") SELECT "createdAt", "details", "id", "issueId", "shopId", "variantId" FROM "VariantIssue";
DROP TABLE "VariantIssue";
ALTER TABLE "new_VariantIssue" RENAME TO "VariantIssue";
CREATE INDEX "VariantIssue_shopId_variantId_idx" ON "VariantIssue"("shopId", "variantId");
CREATE INDEX "VariantIssue_shopId_issueId_idx" ON "VariantIssue"("shopId", "issueId");
CREATE UNIQUE INDEX "VariantIssue_shopId_variantId_issueId_key" ON "VariantIssue"("shopId", "variantId", "issueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ScanJob_shopId_status_createdAt_idx" ON "ScanJob"("shopId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ScanJob_shopId_createdAt_idx" ON "ScanJob"("shopId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Scan_scanJobId_key" ON "Scan"("scanJobId");

-- CreateIndex
CREATE INDEX "Scan_shopId_createdAt_idx" ON "Scan"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_shopId_status_idx" ON "Scan"("shopId", "status");

-- CreateIndex
CREATE INDEX "Scan_shopId_completedAt_idx" ON "Scan"("shopId", "completedAt");
