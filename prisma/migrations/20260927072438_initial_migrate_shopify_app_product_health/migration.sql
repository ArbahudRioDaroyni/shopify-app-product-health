-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('IDLE', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('improvement', 'needs_attention', 'critical');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('info', 'warning', 'critical');

-- CreateEnum
CREATE TYPE "ScanType" AS ENUM ('full', 'manual', 'incremental', 'part');

-- CreateEnum
CREATE TYPE "ScanJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" SERIAL NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "shopifyDomain" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'IDLE',
    "scanStartedAt" TIMESTAMP(3),
    "lastScanError" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "highPenalty" INTEGER NOT NULL DEFAULT 15,
    "mediumPenalty" INTEGER NOT NULL DEFAULT 6,
    "lowPenalty" INTEGER NOT NULL DEFAULT 2,
    "maxHighPenalty" INTEGER NOT NULL DEFAULT 60,
    "maxMediumPenalty" INTEGER NOT NULL DEFAULT 30,
    "maxLowPenalty" INTEGER NOT NULL DEFAULT 10,
    "autoReconcileDays" INTEGER NOT NULL DEFAULT 7,
    "disabledRuleIds" TEXT NOT NULL DEFAULT '[]',
    "autoScanEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "featuredImage" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id","shopId")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id","shopId")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "handle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id","shopId")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'LOW',
    "priority" "Priority" NOT NULL DEFAULT 'improvement',
    "tone" "Tone" NOT NULL DEFAULT 'info',
    "impact" TEXT NOT NULL,
    "alert" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIssue" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ProductIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantIssue" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "variantId" TEXT NOT NULL,
    "issueId" INTEGER NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "VariantIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueTrend" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "issueId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "status" "InventoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "scanType" "ScanType" NOT NULL DEFAULT 'full',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionHealth" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "collectionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCollection" (
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,

    CONSTRAINT "ProductCollection_pkey" PRIMARY KEY ("shopId","productId","collectionId")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCategory" (
    "shopId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("shopId","productId","categoryId")
);

-- CreateTable
CREATE TABLE "ScanJob" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "type" "ScanType" NOT NULL DEFAULT 'full',
    "status" "ScanJobStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "shopId" INTEGER NOT NULL,
    "scanJobId" TEXT,
    "type" "ScanType" NOT NULL DEFAULT 'full',
    "status" "ScanStatus" NOT NULL DEFAULT 'IDLE',
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
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyId_key" ON "Shop"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_shopifyDomain_key" ON "Shop"("shopifyDomain");

-- CreateIndex
CREATE INDEX "Shop_shopifyId_idx" ON "Shop"("shopifyId");

-- CreateIndex
CREATE INDEX "Shop_shopifyDomain_idx" ON "Shop"("shopifyDomain");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_shopId_key" ON "AppSetting"("shopId");

-- CreateIndex
CREATE INDEX "Product_shopId_title_idx" ON "Product"("shopId", "title");

-- CreateIndex
CREATE INDEX "Collection_shopId_title_idx" ON "Collection"("shopId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_slug_key" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "Issue_slug_idx" ON "Issue"("slug");

-- CreateIndex
CREATE INDEX "ProductIssue_shopId_productId_idx" ON "ProductIssue"("shopId", "productId");

-- CreateIndex
CREATE INDEX "ProductIssue_shopId_issueId_idx" ON "ProductIssue"("shopId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIssue_shopId_productId_issueId_key" ON "ProductIssue"("shopId", "productId", "issueId");

-- CreateIndex
CREATE INDEX "VariantIssue_shopId_variantId_idx" ON "VariantIssue"("shopId", "variantId");

-- CreateIndex
CREATE INDEX "VariantIssue_shopId_issueId_idx" ON "VariantIssue"("shopId", "issueId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantIssue_shopId_variantId_issueId_key" ON "VariantIssue"("shopId", "variantId", "issueId");

-- CreateIndex
CREATE INDEX "IssueTrend_shopId_date_idx" ON "IssueTrend"("shopId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "IssueTrend_shopId_issueId_status_date_key" ON "IssueTrend"("shopId", "issueId", "status", "date");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_shopId_createdAt_idx" ON "DashboardSnapshot"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_shopId_status_completedAt_idx" ON "DashboardSnapshot"("shopId", "status", "completedAt");

-- CreateIndex
CREATE INDEX "CollectionHealth_shopId_date_idx" ON "CollectionHealth"("shopId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionHealth_shopId_collectionId_date_key" ON "CollectionHealth"("shopId", "collectionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

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

-- AddForeignKey
ALTER TABLE "AppSetting" ADD CONSTRAINT "AppSetting_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantIssue" ADD CONSTRAINT "VariantIssue_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantIssue" ADD CONSTRAINT "VariantIssue_variantId_shopId_fkey" FOREIGN KEY ("variantId", "shopId") REFERENCES "Variant"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantIssue" ADD CONSTRAINT "VariantIssue_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTrend" ADD CONSTRAINT "IssueTrend_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueTrend" ADD CONSTRAINT "IssueTrend_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionHealth" ADD CONSTRAINT "CollectionHealth_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionHealth" ADD CONSTRAINT "CollectionHealth_collectionId_shopId_fkey" FOREIGN KEY ("collectionId", "shopId") REFERENCES "Collection"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCollection" ADD CONSTRAINT "ProductCollection_collectionId_shopId_fkey" FOREIGN KEY ("collectionId", "shopId") REFERENCES "Collection"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_shopId_fkey" FOREIGN KEY ("productId", "shopId") REFERENCES "Product"("id", "shopId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_scanJobId_fkey" FOREIGN KEY ("scanJobId") REFERENCES "ScanJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
