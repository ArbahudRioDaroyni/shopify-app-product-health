import db from "../../db.server.js";
import { getProducts } from "../shopify/products.server.js";
import { rules } from "../rules/index.js";
import { scanProducts } from "./product-scanner.server.js";
import { getCollectionHealth } from "./collection-health.server.js";
import { calculateHealthScore } from "./health-score.server.js";
import { summarizeIssues } from "./issue-summary.server.js";

const SEVERITY_RANK = { improvement: 1, warning: 2, critical: 3 };
const backgroundScans = new Set();

export function isFullScanRunning(shop) {
  return backgroundScans.has(shop);
}

function getProductId(result) {
  return result.productId || result.id;
}

function getSeverity(rule) {
  if (rule.tone === "critical") return "critical";
  if (rule.tone === "warning") return "warning";
  return "improvement";
}

function getProductHealth(products, scanResult) {
  const productSeverity = new Map();

  for (const rule of scanResult) {
    const severity = getSeverity(rule);

    for (const result of rule.results || []) {
      const productId = getProductId(result);
      if (!productId) continue;

      const currentSeverity = productSeverity.get(productId);
      if (!currentSeverity || SEVERITY_RANK[severity] > SEVERITY_RANK[currentSeverity]) {
        productSeverity.set(productId, severity);
      }
    }
  }

  return products.map((product) => {
    const status = productSeverity.get(product.id) || "healthy";

    return {
      productId: product.id,
      productTitle: product.title,
      productStatus: product.status,
      status,
    };
  });
}

function getIssueRows(shop, scanResult, productHealthById) {
  return scanResult.flatMap((rule) => {
    const severity = getSeverity(rule);

    return (rule.results || []).map((result) => {
      const productId = getProductId(result);
      const productHealth = productHealthById.get(productId);

      return {
        shop,
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        severity,
        productId,
        productTitle: productHealth?.productTitle || result.productTitle,
        productStatus: productHealth?.productStatus || result.productStatus,
        variantId: result.variantId,
        details: JSON.stringify({
          variantTitle: result.variantTitle,
          variantId: result.variantId,
        }),
        productHealthId: productHealth?.id,
      };
    });
  });
}

export async function saveCatalogScan({
  shop,
  products,
  scanResult,
  collectionHealth = [],
  scanType = "full",
  lastFullScanAt = scanType === "full" ? new Date() : null,
}) {
  const summary = summarizeIssues(scanResult);
  const productHealth = getProductHealth(products, scanResult);
  const productHealthById = new Map();
  const healthScore = calculateHealthScore(scanResult);

  return db.$transaction(async (transaction) => {
    const scan = await transaction.catalogScan.create({
      data: {
        shop,
        status: "completed",
        scanType,
        lastFullScanAt,
        completedAt: new Date(),
        productCount: products.length,
        healthScore,
        totalIssues: summary.total,
        criticalIssues: summary.critical,
        warningIssues: summary.warning,
        improvementIssues: summary.improvement,
      },
    });

    await transaction.productHealth.createMany({
      data: productHealth.map((product) => ({
        ...product,
        shop,
        scanId: scan.id,
      })),
    });

    const savedProductHealth = await transaction.productHealth.findMany({
      where: { scanId: scan.id },
      select: { id: true, productId: true, productTitle: true, productStatus: true },
    });

    for (const product of savedProductHealth) {
      productHealthById.set(product.productId, product);
    }

    const issueRows = getIssueRows(shop, scanResult, productHealthById)
      .map((issue) => ({ ...issue, scanId: scan.id }));

    if (issueRows.length > 0) {
      await transaction.catalogIssue.createMany({ data: issueRows });
    }

    if (collectionHealth.length > 0) {
      await transaction.collectionHealth.createMany({
        data: collectionHealth.map((collection) => ({
          shop,
          scanId: scan.id,
          collectionId: collection.id,
          collectionTitle: collection.title,
          score: collection.score,
        })),
      });
    }

    return scan;
  });
}

export function getLatestCatalogScan(shop) {
  return db.catalogScan.findFirst({
    where: { shop, status: { in: ["completed", "stale"] } },
    orderBy: { completedAt: "desc" },
    include: {
      productHealth: true,
      issues: true,
      collectionHealth: true,
    },
  });
}

export function startFullScanInBackground({ admin, shop }) {
  if (backgroundScans.has(shop)) return;

  backgroundScans.add(shop);
  void (async () => {
    try {
      const products = await getProducts(admin);
      const scanResult = scanProducts(products);
      const collectionHealth = getCollectionHealth(products, scanResult);

      await saveCatalogScan({ shop, products, scanResult, collectionHealth });
    } finally {
      backgroundScans.delete(shop);
    }
  })();
}

export async function markCatalogScanStale(shop) {
  return db.catalogScan.updateMany({
    where: { shop, status: "completed" },
    data: { status: "stale" },
  });
}

function getRuleScanForProduct(product) {
  return rules.map((rule) => ({
    ...rule,
    results: rule.check([product]),
  }));
}

function getIssueCountBySeverity(issues) {
  return issues.reduce((counts, issue) => {
    counts[issue.severity] += 1;
    return counts;
  }, { critical: 0, warning: 0, improvement: 0 });
}

export async function saveIncrementalProductScan({ shop, product, deleted = false }) {
  const latestScan = await getLatestCatalogScan(shop);
  if (!latestScan) return null;

  const productId = product.id;
  const oldProduct = latestScan.productHealth.find((item) => item.productId === productId);
  const oldIssues = latestScan.issues.filter((issue) => issue.productId === productId);
  const newScanResult = deleted ? [] : getRuleScanForProduct(product);
  const productHealth = deleted ? null : getProductHealth([product], newScanResult)[0];
  const productHealthById = new Map();
  const newIssueRows = deleted ? [] : getIssueRows(shop, newScanResult, productHealthById);
  for (const issue of newIssueRows) {
    issue.productStatus = product.status;
    issue.productTitle = product.title;
  }
  const oldCounts = getIssueCountBySeverity(oldIssues);
  const newCounts = getIssueCountBySeverity(newIssueRows);
  const productCount = latestScan.productCount - (deleted && oldProduct ? 1 : 0) + (!deleted && !oldProduct ? 1 : 0);

  return db.$transaction(async (transaction) => {
    const scan = await transaction.catalogScan.create({
      data: {
        shop,
        status: "completed",
        scanType: "incremental",
        lastFullScanAt: latestScan.lastFullScanAt,
        completedAt: new Date(),
        productCount,
        healthScore: latestScan.healthScore,
        totalIssues: latestScan.totalIssues - oldIssues.length + newIssueRows.length,
        criticalIssues: latestScan.criticalIssues - oldCounts.critical + newCounts.critical,
        warningIssues: latestScan.warningIssues - oldCounts.warning + newCounts.warning,
        improvementIssues: latestScan.improvementIssues - oldCounts.improvement + newCounts.improvement,
      },
    });

    const copiedProducts = latestScan.productHealth
      .filter((item) => item.productId !== productId)
      .map((item) => ({
        shop,
        scanId: scan.id,
        productId: item.productId,
        productTitle: item.productTitle,
        productStatus: item.productStatus,
        score: item.score,
        status: item.status,
      }));

    if (productHealth) {
      copiedProducts.push({
        shop,
        scanId: scan.id,
        ...productHealth,
      });
    }

    if (copiedProducts.length > 0) {
      await transaction.productHealth.createMany({ data: copiedProducts });
    }

    const savedProducts = await transaction.productHealth.findMany({
      where: { scanId: scan.id },
      select: { id: true, productId: true, productTitle: true, productStatus: true },
    });
    for (const savedProduct of savedProducts) {
      productHealthById.set(savedProduct.productId, savedProduct);
    }

    const copiedIssues = latestScan.issues
      .filter((issue) => issue.productId !== productId)
      .map((issue) => ({
        shop,
        scanId: scan.id,
        productHealthId: productHealthById.get(issue.productId)?.id,
        ruleId: issue.ruleId,
        ruleName: issue.ruleName,
        category: issue.category,
        severity: issue.severity,
        productId: issue.productId,
        productTitle: issue.productTitle,
        productStatus: issue.productStatus,
        variantId: issue.variantId,
        details: issue.details,
      }));

    const incrementalIssues = newIssueRows.map((issue) => ({
      ...issue,
      scanId: scan.id,
      productHealthId: productHealthById.get(productId)?.id,
    }));

    if (copiedIssues.length + incrementalIssues.length > 0) {
      await transaction.catalogIssue.createMany({
        data: [...copiedIssues, ...incrementalIssues],
      });
    }

    if (latestScan.collectionHealth.length > 0) {
      await transaction.collectionHealth.createMany({
        data: latestScan.collectionHealth.map((collection) => ({
          shop,
          scanId: scan.id,
          collectionId: collection.collectionId,
          collectionTitle: collection.collectionTitle,
          score: collection.score,
        })),
      });
    }

    return scan;
  });
}

export function getScanHistory(shop, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return db.catalogScan.findMany({
    where: {
      shop,
      status: { in: ["completed", "stale"] },
      completedAt: { gte: since },
    },
    orderBy: { completedAt: "asc" },
    select: {
      completedAt: true,
      healthScore: true,
      totalIssues: true,
      criticalIssues: true,
      warningIssues: true,
      improvementIssues: true,
    },
  });
}

export function getDashboardDataFromScan(scan) {
  if (!scan) return null;

  const issuesByRule = new Map();

  for (const issue of scan.issues) {
    if (!issuesByRule.has(issue.ruleId)) {
      const rule = rules.find((candidate) => candidate.id === issue.ruleId);
      issuesByRule.set(issue.ruleId, {
        id: issue.ruleId,
        name: issue.ruleName,
        description: rule?.description || "",
        category: issue.category,
        severity: issue.severity,
        productStatus: issue.productStatus,
        tone: issue.severity === "critical" ? "critical" : issue.severity === "warning" ? "warning" : "info",
        results: [],
      });
    }

    issuesByRule.get(issue.ruleId).results.push(issue);
  }

  const productHealth = scan.productHealth.reduce(
    (counts, product) => {
      counts[product.status] = (counts[product.status] || 0) + 1;
      return counts;
    },
    { healthy: 0, improvement: 0, warning: 0, critical: 0 },
  );

  return {
    scanResult: [...issuesByRule.values()],
    issueSummary: {
      total: scan.totalIssues,
      critical: scan.criticalIssues,
      warning: scan.warningIssues,
      improvement: scan.improvementIssues,
    },
    healthScore: scan.healthScore ?? 0,
    productHealth: {
      total: scan.productCount,
      healthy: productHealth.healthy,
      warning: productHealth.warning,
      critical: productHealth.critical,
    },
    collectionHealth: scan.collectionHealth,
  };
}

