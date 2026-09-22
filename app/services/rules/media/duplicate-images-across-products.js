export const duplicateImagesAcrossProducts = {
  id: "duplicate-images-across-products",
  name: "Duplicate Images Across Products",
  summary: "Different products use the same image.",
  description: "Identical images uploaded across multiple different products, causing catalog confusion.",
  category: "media",
  severity: "LOW",
  priority: "improvement",
  impact: "Can confuse shoppers and make product listings look less distinct.",
  alert: "Use product-specific images or confirm intentional image reuse.",
  tone: "info",

  check(products) {
    const imagesMap = new Map();

    // 1. Group media/images based on clean URLs.
    for (const product of products) {
      if (!product) continue;

      const mediaList = Array.isArray(product.media)
        ? product.media
        : product.media?.nodes ||
          product.media?.edges?.map((e) => e.node) ||
          [];

      for (const media of mediaList) {
        if (!media?.image) continue;

        const rawUrl = media.image.url || media.image.originalSrc;
        if (!rawUrl) continue;

        // Remove Shopify CDN query parameters.
        const cleanUrl = rawUrl.split("?")[0];

        if (!imagesMap.has(cleanUrl)) imagesMap.set(cleanUrl, []);

        imagesMap.get(cleanUrl).push({
          product,
          media,
        });
      }
    }

    // 2. Build issues per product.
    const productIssuesMap = new Map();

    for (const items of imagesMap.values()) {
      const uniqueProductIds = new Set(
        items.map((item) => item.product.id)
      );

      // Ignore images used only by one product.
      if (uniqueProductIds.size <= 1) continue;

      for (const { product } of items) {
        if (!productIssuesMap.has(product.id)) {
          productIssuesMap.set(product.id, {
            product,
            details: [],
          });
        }

        const entry = productIssuesMap.get(product.id);

        // Find the same image used by other products.
        const conflictingItems = items.filter(
          (otherItem) => otherItem.product.id !== product.id
        );

        for (const { product: conflictingProduct, media: conflictingMedia } of conflictingItems) {
          entry.details.push({
            product: conflictingProduct.legacyResourceId,
            media: {
              id: conflictingMedia.id || null,
              image: {
                id: conflictingMedia.image?.id || null,
                url:
                  conflictingMedia.image?.url ||
                  conflictingMedia.image?.originalSrc ||
                  null,
              },
            },
          });
        }
      }
    }

    // 3. Format the standard result.
    const results = [];

    for (const { product, details } of productIssuesMap.values()) {
      results.push({
        productId: product.id,
        productLegacyResourceId: product.legacyResourceId || null,
        productTitle: product.title,
        variantId: null,
        variantLegacyResourceId: null,
        variantTitle: null,
        status: product.status,
        featuredImage: product.featuredImage || null,
        issue: "Duplicate Images Across Products",
        details,
      });
    }

    return results;
  },
};