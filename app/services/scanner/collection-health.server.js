import { calculateHealthScore } from "./health-score.server.js";

function getProductId(result) {
  return result.productId || result.id;
}

function createIssueIndex(scanResult) {
  const issueIndex = new Map();

  for (const rule of scanResult) {
    for (const result of rule.results || []) {
      const productId = getProductId(result);
      if (!productId) continue;

      if (!issueIndex.has(productId)) issueIndex.set(productId, []);
      issueIndex.get(productId).push({ rule, result });
    }
  }

  return issueIndex;
}

function getCollectionProducts(products) {
  const collections = new Map();

  for (const product of products) {
    for (const collection of product.collections?.nodes || []) {
      if (!collections.has(collection.id)) {
        collections.set(collection.id, { ...collection, productIds: new Set() });
      }

      collections.get(collection.id).productIds.add(product.id);
    }
  }

  return [
    {
      id: "all-products",
      title: "All Products",
      productIds: new Set(products.map((product) => product.id)),
    },
    ...collections.values(),
  ];
}

export function getCollectionHealth(products, scanResult) {
  const issueIndex = createIssueIndex(scanResult);

  return getCollectionProducts(products).map((collection) => {
    const resultsByRule = new Map();

    for (const productId of collection.productIds) {
      for (const issue of issueIndex.get(productId) || []) {
        if (!resultsByRule.has(issue.rule.id)) {
          resultsByRule.set(issue.rule.id, { rule: issue.rule, results: [] });
        }

        resultsByRule.get(issue.rule.id).results.push(issue.result);
      }
    }

    const collectionScanResult = scanResult.map((rule) => ({
      ...rule,
      results: resultsByRule.get(rule.id)?.results || [],
    }));

    return {
      id: collection.id,
      title: collection.title,
      score: calculateHealthScore(collectionScanResult),
    };
  });
}
