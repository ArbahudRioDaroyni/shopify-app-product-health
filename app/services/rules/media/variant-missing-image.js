export const variantMissingImage = {
	id: "variant-missing-image",
	name: "Variant Missing Image",
	summary: "Product variants do not have an assigned image.",
	description: "Specific product variants without assigned variant images.",
	category: "media",
	severity: "LOW",
	priority: "improvement",
	impact: "Shoppers may not see the visual differences between variant options.",
	alert: "Assign an accurate image to each visually distinct variant.",
	tone: "info",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => !variant.image?.id && !variant.image?.url)
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Variant Missing Image"
			})));
	},
};
