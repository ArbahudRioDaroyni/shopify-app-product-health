export const missingTags = {
	id: "missing-tags",
	name: "Missing Tags",
	summary: "Products do not have any tags.",
	description: "Products without tags, impacting store search, automated collections, and filtering.",
	category: "organization",
	severity: "LOW",
	priority: "improvement",
	impact: "Limits store search, filtering, and automated collection workflows.",
	alert: "Add relevant, consistent tags to each affected product.",
	tone: "info",

	check(products) {
		return products.filter((product) => !product.tags?.length)
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				name: "Missing Tags"
			}))
	},
};
