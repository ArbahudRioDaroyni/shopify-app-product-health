/*
  Warnings:

  - The primary key for the `ProductCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ProductCollection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Variant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[shopId,collectionId,date]` on the table `CollectionHealth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[shopId,productId,issueId]` on the table `ProductIssue` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shopId` to the `VariantIssue` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CollectionHealth_collectionId_date_key";

-- DropIndex
DROP INDEX "ProductIssue_productId_issueId_key";

-- DropIndex
DROP INDEX "ProductIssue_issueId_idx";

-- DropIndex
DROP INDEX "ProductIssue_productId_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductCategory" (
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    PRIMARY KEY ("shopId", "productId", "categoryId"),
    CONSTRAINT "ProductCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCategory_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductCategory" ("categoryId", "productId", "shopId") SELECT "categoryId", "productId", "shopId" FROM "ProductCategory";
DROP TABLE "ProductCategory";
ALTER TABLE "new_ProductCategory" RENAME TO "ProductCategory";
CREATE TABLE "new_ProductCollection" (
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    PRIMARY KEY ("shopId", "productId", "collectionId"),
    CONSTRAINT "ProductCollection_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCollection_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCollection_collectionId_shopId_fkey" FOREIGN KEY ("collectionId", "shopId") REFERENCES "Collection" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductCollection" ("collectionId", "productId", "shopId") SELECT "collectionId", "productId", "shopId" FROM "ProductCollection";
DROP TABLE "ProductCollection";
ALTER TABLE "new_ProductCollection" RENAME TO "ProductCollection";
CREATE TABLE "new_Variant" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("id", "shopId"),
    CONSTRAINT "Variant_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Variant_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("createdAt", "id", "productId", "shopId", "sku", "title", "updatedAt") SELECT "createdAt", "id", "productId", "shopId", "sku", "title", "updatedAt" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
CREATE TABLE "new_VariantIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VariantIssue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariantIssue_variantId_shopId_fkey" FOREIGN KEY ("variantId", "shopId") REFERENCES "Variant" ("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariantIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VariantIssue" ("createdAt", "details", "id", "issueId", "variantId") SELECT "createdAt", "details", "id", "issueId", "variantId" FROM "VariantIssue";
DROP TABLE "VariantIssue";
ALTER TABLE "new_VariantIssue" RENAME TO "VariantIssue";
CREATE INDEX "VariantIssue_shopId_variantId_idx" ON "VariantIssue"("shopId", "variantId");
CREATE INDEX "VariantIssue_shopId_issueId_idx" ON "VariantIssue"("shopId", "issueId");
CREATE UNIQUE INDEX "VariantIssue_shopId_variantId_issueId_key" ON "VariantIssue"("shopId", "variantId", "issueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CollectionHealth_shopId_collectionId_date_key" ON "CollectionHealth"("shopId", "collectionId", "date");

-- CreateIndex
CREATE INDEX "ProductIssue_shopId_productId_idx" ON "ProductIssue"("shopId", "productId");

-- CreateIndex
CREATE INDEX "ProductIssue_shopId_issueId_idx" ON "ProductIssue"("shopId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIssue_shopId_productId_issueId_key" ON "ProductIssue"("shopId", "productId", "issueId");
