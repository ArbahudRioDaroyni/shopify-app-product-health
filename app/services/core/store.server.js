import db from "../../db.server.js";
import { updateShopScanStatus } from "../models/shop.server.js";
import { upsertIssue } from "../models/issue.server.js";
import { upsertProduct, upsertProductIssue } from "../models/product.server.js";
import { upsertVariant, upsertVariantIssue } from "../models/variant.server.js";
import { storeDashboardSnapshot } from "../models/dashboard.server.js";
import { recordDailyIssueTrends } from "../models/issue.server";

export async function saveBulkCatalogScan({ shopId, scanResults, scanType = "full" }) {
  const startedAt = new Date();

  try {
    await updateShopScanStatus({shopId, status: "PROCESSING"});

    const snapshot = await db.$transaction(async (tx) => {
      await tx.productIssue.deleteMany({});
      await tx.variantIssue.deleteMany({});

      for (const item of scanResults) {
        await syncProductOrVariantAndIssues({db: tx, shopId, item});
        // await syncProductCollectionsAndCategory({db: tx, item});
      }

      await recordDailyIssueTrends({db: tx, shopId});
      console.log(shopId);
      // await calculateCollectionHealths({db: tx, shopId});
      return await storeDashboardSnapshot({db: tx, shopId, scanType, startedAt});
    });

    await updateShopScanStatus({shopId, status: "COMPLETED"});

    return snapshot;
  } catch (error) {
    await updateShopScanStatus({shopId, status: "FAILED", error: JSON.stringify(error.message)});
    throw error;
  }
}


export async function savePartialCatalogScan({
  shopId,
  targetProductIds = [],
  scanResults = [],
  isDelete = false,
}) {
  const startedAt = new Date();

  return await db.$transaction(async (tx) => {
    // 1. Jika Webhook Delete: Hapus produk & isu terkait
    if (isDelete) {
      await tx.product.deleteMany({
        where: { id: { in: targetProductIds.map(String) } },
      });
    } else {
      // 2. Hapus Isu Lama KHUSUS untuk produk-produk yang terdampak
      await tx.productIssue.deleteMany({
        where: { productId: { in: targetProductIds.map(String) } },
      });
      await tx.variantIssue.deleteMany({
        where: { variant: { productId: { in: targetProductIds.map(String) } } },
      });

      for (const item of scanResults) {
        await syncProductOrVariantAndIssues({db: tx, shopId, item});
      }
    }

    await recordDailyIssueTrends({shopId});
    return await storeDashboardSnapshot({db: tx, shopId, scanType: "part", startedAt});
  });
}

async function syncProductOrVariantAndIssues({db, shopId, item}) {
  const product = await upsertProduct({db, shopId, item});
  const issue = await upsertIssue({db, item});

  if (!issue) return product;

  if (item.variantId || item.variantLegacyResourceId) {
    const variant = await upsertVariant({db, shopId, item, product});
    upsertVariantIssue({db, shopId, variant, issue, issueDetails: JSON.stringify(item.details)});
  } else {
    upsertProductIssue({db, shopId, product, issue, issueDetails: JSON.stringify(item.details)});
  }

  return product;
}

// async function syncProductCollectionsAndCategory({db, item}) {
//   const productId = String(item.productLegacyResourceId || item.productId);

//   // 1. Sync Category & ProductCategory (jika ada data category dari Shopify)
//   if (item.category) {
//     const categoryName = typeof item.category === "string" ? item.category : item.category.name;
//     const categorySlug = convertToSlug({text: categoryName});

//     if (categorySlug) {
//       const category = await db.category.upsert({
//         where: { slug: categorySlug },
//         update: { name: categoryName },
//         create: { name: categoryName, slug: categorySlug },
//       });

//       await db.productCategory.upsert({
//         where: {
//           productId_categoryId: {
//             productId,
//             categoryId: category.id,
//           },
//         },
//         update: {},
//         create: { productId, categoryId: category.id },
//       });
//     }
//   }

//   // 2. Sync Collection & ProductCollection Junction
//   if (item.collections && Array.isArray(item.collections)) {
//     for (const col of item.collections) {
//       const collectionId = String(col.id || col.collectionId);
//       const collectionTitle = col.title || "Untitled Collection";
//       const collectionHandle = col.handle || convertToSlug({text: collectionTitle});

//       await db.collection.upsert({
//         where: { id: collectionId },
//         update: { title: collectionTitle, handle: collectionHandle },
//         create: { id: collectionId, title: collectionTitle, handle: collectionHandle },
//       });

//       await db.productCollection.upsert({
//         where: {
//           productId_collectionId: {
//             productId,
//             collectionId,
//           },
//         },
//         update: {},
//         create: { productId, collectionId },
//       });
//     }
//   }
// }

// async function calculateCollectionHealths({db, shopId}) {
//   const collections = await db.collection.findMany({
//     include: {
//       products: {
//         include: {
//           product: {
//             include: {
//               productIssues: { include: { issue: true } },
//             },
//           },
//         },
//       },
//     },
//   });

//   const today = new Date();
//   today.setUTCHours(0, 0, 0, 0);

//   for (const col of collections) {
//     const totalProducts = col.products.length;
//     if (totalProducts === 0) continue;

//     let criticalCount = 0;
//     let needsAttentionCount = 0;

//     for (const pc of col.products) {
//       const issues = pc.product.productIssues || [];
//       const hasHigh = issues.some((pi) => pi.issue.severity === "HIGH");
//       const hasMedium = issues.some((pi) => pi.issue.severity === "MEDIUM");

//       if (hasHigh) criticalCount++;
//       else if (hasMedium) needsAttentionCount++;
//     }

//     const penalty = criticalCount * 15 + needsAttentionCount * 5;
//     const score = Math.max(0, 100 - Math.round(penalty / totalProducts));

//     await db.collectionHealth.upsert({
//       where: {
//         collectionId_date: {
//           collectionId: col.id,
//           date: today,
//         },
//       },
//       update: { score },
//       create: {
//         shopId,
//         collectionId: col.id,
//         date: today,
//         score,
//       },
//     });
//   }
// }