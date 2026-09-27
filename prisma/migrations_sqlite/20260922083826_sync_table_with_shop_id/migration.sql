/*
  Warnings:

  - The primary key for the `Collection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `featuredImage` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `shopId` to the `Collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `ProductCategory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `ProductCollection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `ProductIssue` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "highPenalty" INTEGER NOT NULL DEFAULT 15,
    "mediumPenalty" INTEGER NOT NULL DEFAULT 5,
    "lowPenalty" INTEGER NOT NULL DEFAULT 2,
    "maxHighPenalty" INTEGER NOT NULL DEFAULT 60,
    "maxMediumPenalty" INTEGER NOT NULL DEFAULT 30,
    "maxLowPenalty" INTEGER NOT NULL DEFAULT 10,
    "autoReconcileDays" INTEGER NOT NULL DEFAULT 7,
    "disabledRuleIds" TEXT NOT NULL DEFAULT '[]',
    "autoScanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppSetting_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AppSetting" ("autoReconcileDays", "disabledRuleIds", "highPenalty", "id", "lowPenalty", "maxHighPenalty", "maxLowPenalty", "maxMediumPenalty", "mediumPenalty", "shopId", "updatedAt") SELECT "autoReconcileDays", "disabledRuleIds", "highPenalty", "id", "lowPenalty", "maxHighPenalty", "maxLowPenalty", "maxMediumPenalty", "mediumPenalty", "shopId", "updatedAt" FROM "AppSetting";
DROP TABLE "AppSetting";
ALTER TABLE "new_AppSetting" RENAME TO "AppSetting";
CREATE UNIQUE INDEX "AppSetting_shopId_key" ON "AppSetting"("shopId");
CREATE TABLE "new_Collection" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("id", "shopId"),
    CONSTRAINT "Collection_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Collection" ("createdAt", "handle", "id", "title", "updatedAt") SELECT "createdAt", "handle", "id", "title", "updatedAt" FROM "Collection";
DROP TABLE "Collection";
ALTER TABLE "new_Collection" RENAME TO "Collection";
CREATE INDEX "Collection_shopId_title_idx" ON "Collection"("shopId", "title");
CREATE TABLE "new_CollectionHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "collectionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionHealth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionHealth_collectionId_shopId_fkey" FOREIGN KEY ("collectionId", "shopId") REFERENCES "Collection" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CollectionHealth" ("collectionId", "createdAt", "date", "id", "score", "shopId") SELECT "collectionId", "createdAt", "date", "id", "score", "shopId" FROM "CollectionHealth";
DROP TABLE "CollectionHealth";
ALTER TABLE "new_CollectionHealth" RENAME TO "CollectionHealth";
CREATE INDEX "CollectionHealth_shopId_date_idx" ON "CollectionHealth"("shopId", "date");
CREATE UNIQUE INDEX "CollectionHealth_collectionId_date_key" ON "CollectionHealth"("collectionId", "date");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "featuredImage" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("id", "shopId"),
    CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("createdAt", "featuredImage", "id", "status", "title", "updatedAt") SELECT "createdAt", "featuredImage", "id", "status", "title", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE INDEX "Product_shopId_title_idx" ON "Product"("shopId", "title");
CREATE TABLE "new_ProductCategory" (
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    PRIMARY KEY ("productId", "categoryId"),
    CONSTRAINT "ProductCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCategory_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductCategory" ("categoryId", "productId") SELECT "categoryId", "productId" FROM "ProductCategory";
DROP TABLE "ProductCategory";
ALTER TABLE "new_ProductCategory" RENAME TO "ProductCategory";
CREATE TABLE "new_ProductCollection" (
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "collectionId"),
    CONSTRAINT "ProductCollection_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCollection_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCollection_collectionId_shopId_fkey" FOREIGN KEY ("collectionId", "shopId") REFERENCES "Collection" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductCollection" ("collectionId", "productId") SELECT "collectionId", "productId" FROM "ProductCollection";
DROP TABLE "ProductCollection";
ALTER TABLE "new_ProductCollection" RENAME TO "ProductCollection";
CREATE TABLE "new_ProductIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductIssue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductIssue_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductIssue" ("createdAt", "details", "id", "issueId", "productId") SELECT "createdAt", "details", "id", "issueId", "productId" FROM "ProductIssue";
DROP TABLE "ProductIssue";
ALTER TABLE "new_ProductIssue" RENAME TO "ProductIssue";
CREATE INDEX "ProductIssue_productId_idx" ON "ProductIssue"("productId");
CREATE INDEX "ProductIssue_issueId_idx" ON "ProductIssue"("issueId");
CREATE UNIQUE INDEX "ProductIssue_productId_issueId_key" ON "ProductIssue"("productId", "issueId");
CREATE TABLE "new_Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Variant_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("createdAt", "id", "productId", "sku", "title", "updatedAt") SELECT "createdAt", "id", "productId", "sku", "title", "updatedAt" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
