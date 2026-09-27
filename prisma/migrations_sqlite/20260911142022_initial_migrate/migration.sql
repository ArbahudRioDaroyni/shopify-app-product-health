-- CreateTable
CREATE TABLE "Shop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shopifyDomain" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT DEFAULT 'USD',
    "timezone" TEXT DEFAULT 'UTC',
    "installedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scanStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "scanStartedAt" DATETIME,
    "lastScanError" TEXT
);

-- CreateTable
CREATE TABLE "AppSetting" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppSetting_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "featuredImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'LOW',
    "priority" TEXT NOT NULL DEFAULT 'improvement',
    "tone" TEXT NOT NULL DEFAULT 'info',
    "impact" TEXT NOT NULL,
    "alert" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductIssue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VariantIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VariantIssue_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VariantIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssueTrend" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "variantCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssueTrend_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopIssueSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "issueId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TopIssueSummary_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TopIssueSummary_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "scanType" TEXT NOT NULL DEFAULT 'full',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DashboardSnapshot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" INTEGER NOT NULL,
    "collectionId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionHealth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionHealth_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductCollection" (
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "collectionId"),
    CONSTRAINT "ProductCollection_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    PRIMARY KEY ("productId", "categoryId"),
    CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyDomain_key" ON "Shop"("shopifyDomain");

-- CreateIndex
CREATE INDEX "Shop_shopifyDomain_idx" ON "Shop"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_shopId_key" ON "AppSetting"("shopId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Variant_productId_idx" ON "Variant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_slug_key" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "Issue_slug_idx" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "ProductIssue_productId_idx" ON "ProductIssue"("productId");

-- CreateIndex
CREATE INDEX "ProductIssue_issueId_idx" ON "ProductIssue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIssue_productId_issueId_key" ON "ProductIssue"("productId", "issueId");

-- CreateIndex
CREATE INDEX "VariantIssue_variantId_idx" ON "VariantIssue"("variantId");

-- CreateIndex
CREATE INDEX "VariantIssue_issueId_idx" ON "VariantIssue"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantIssue_variantId_issueId_key" ON "VariantIssue"("variantId", "issueId");

-- CreateIndex
CREATE INDEX "IssueTrend_date_idx" ON "IssueTrend"("date");

-- CreateIndex
CREATE INDEX "IssueTrend_issueId_idx" ON "IssueTrend"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueTrend_issueId_date_key" ON "IssueTrend"("issueId", "date");

-- CreateIndex
CREATE INDEX "TopIssueSummary_shopId_date_idx" ON "TopIssueSummary"("shopId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TopIssueSummary_shopId_issueId_status_date_key" ON "TopIssueSummary"("shopId", "issueId", "status", "date");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_shopId_createdAt_idx" ON "DashboardSnapshot"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_shopId_status_completedAt_idx" ON "DashboardSnapshot"("shopId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "CollectionHealth_shopId_date_idx" ON "CollectionHealth"("shopId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionHealth_collectionId_date_key" ON "CollectionHealth"("collectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
