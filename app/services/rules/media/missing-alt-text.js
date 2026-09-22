export const missingAltText = {
  id: "missing-alt-text",
  name: "Missing Alt Text",
  summary: "Product images do not have descriptive alternative text.",
  description: "Product images missing descriptive alt text, impacting web accessibility and image SEO rankings.",
  category: "media",
	severity: "LOW",
	priority: "improvement",
	impact: "Reduces accessibility for screen-reader users and image search visibility.",
	alert: "Add concise, descriptive alt text to every affected image.",
  tone: "info",

  check(products) {
    const results = [];

    for (const product of products) {
      if (!product) continue;

      const mediaList = Array.isArray(product.media)
        ? product.media
        : product.media?.nodes || product.media?.edges?.map((e) => e.node) || [];

      const missingAltImages = mediaList
        .filter((media) => media?.image && !media.image.altText?.trim())
        .map((media) => ({
          mediaId: media.id,
          imageId: media.image.id || null,
          url: media.image.url || null,
          altText: media.image.altText || "",
        }));

      if (missingAltImages.length > 0) {
        results.push({
          productId: product.id,
          productLegacyResourceId: product.legacyResourceId || null,
          productTitle: product.title,
          variantId: null,
          variantLegacyResourceId: null,
          variantTitle: null,
          status: product.status,
          featuredImage: product.featuredImage || null,
          issue: "Missing Alt Text",
          details: missingAltImages,
        });
      }
    }

    return results;
  },
};
