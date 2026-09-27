/*
  Warnings:

  - You are about to drop the column `productCount` on the `IssueTrend` table. All the data in the column will be lost.
  - You are about to drop the column `variantCount` on the `IssueTrend` table. All the data in the column will be lost.
  - Added the required column `shopId` to the `IssueTrend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `IssueTrend` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IssueTrend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "issueId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IssueTrend_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssueTrend_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IssueTrend" ("createdAt", "date", "id", "issueId") SELECT "createdAt", "date", "id", "issueId" FROM "IssueTrend";
DROP TABLE "IssueTrend";
ALTER TABLE "new_IssueTrend" RENAME TO "IssueTrend";
CREATE INDEX "IssueTrend_shopId_date_idx" ON "IssueTrend"("shopId", "date");
CREATE UNIQUE INDEX "IssueTrend_shopId_issueId_status_date_key" ON "IssueTrend"("shopId", "issueId", "status", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
