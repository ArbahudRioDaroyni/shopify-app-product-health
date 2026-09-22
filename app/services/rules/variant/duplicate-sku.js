export const duplicateSku = {
  id: "duplicate-sku",
  name: "Duplicate SKU",
  summary: "Multiple variants share the same SKU.",
  description: "SKUs shared across multiple variants, causing severe order fulfillment and inventory errors.",
  category: "variant",
  severity: "HIGH",
  priority: "critical",
  impact: "May cause fulfillment errors and inventory mismatches.",
  alert: "Resolve duplicate SKUs immediately to protect order fulfillment and inventory accuracy.",
  tone: "critical",

  check(products) {
    const skusMap = new Map();

    // 1. Group variants by SKU (lowercase & trim)
    for (const product of products) {
      if (!product) continue;

      const variantsList = Array.isArray(product.variants)
        ? product.variants
        : product.variants?.nodes || product.variants?.edges?.map((e) => e.node) || [];

      for (const variant of variantsList) {
        if (!variant) continue;

        const sku = typeof variant.sku === "string" ? variant.sku.trim().toLowerCase() : null;
        if (!sku) continue;

        if (!skusMap.has(sku)) {
          skusMap.set(sku, []);
        }
        skusMap.get(sku).push({ product, variant });
      }
    }

    // 2. Filter duplicate SKU groups (> 1) and format the return value
    const results = [];

    for (const items of skusMap.values()) {
      if (items.length > 1) {
        items.forEach(({ product, variant }) => {
          // Get the legacyResourceId (or ID) from the opposing variant that has the same SKU
          const compareLegacyIds = items
            .filter((item) => item.variant.id !== variant.id)
            .map((item) => {
              return {
                product: item.product.legacyResourceId,
                variant: item.variant.legacyResourceId
              }
            });

          results.push({
            productId: product.id,
            productLegacyResourceId: product.legacyResourceId || null,
            productTitle: product.title,
            variantId: variant.id,
            variantLegacyResourceId: variant.legacyResourceId || null,
            variantTitle: variant.title,
						status: product.status,
						featuredImage: product.featuredImage || null,
            issue: "Duplicate SKU",
						details: compareLegacyIds
          });
        });
      }
    }

    return results;
  },
};
