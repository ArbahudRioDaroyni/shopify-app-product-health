-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopifyId" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scanStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "scanStartedAt" DATETIME,
    "lastScanError" TEXT,
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" DATETIME
);
INSERT INTO "new_Shop" ("id", "installedAt", "isActive", "lastScanError", "scanStartedAt", "scanStatus", "shopifyDomain", "shopifyId", "uninstalledAt") SELECT "id", "installedAt", "isActive", "lastScanError", "scanStartedAt", "scanStatus", "shopifyDomain", "shopifyId", "uninstalledAt" FROM "Shop";
DROP TABLE "Shop";
ALTER TABLE "new_Shop" RENAME TO "Shop";
CREATE UNIQUE INDEX "Shop_shopifyId_key" ON "Shop"("shopifyId");
CREATE UNIQUE INDEX "Shop_shopifyDomain_key" ON "Shop"("shopifyDomain");
CREATE INDEX "Shop_shopifyId_idx" ON "Shop"("shopifyId");
CREATE INDEX "Shop_shopifyDomain_idx" ON "Shop"("shopifyDomain");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
