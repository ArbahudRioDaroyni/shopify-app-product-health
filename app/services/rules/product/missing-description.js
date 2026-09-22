export const missingDescription = {
	id: "missing-description",
	name: "Missing Description",
	summary: "Products have no product description.",
	description: "Products with a completely empty description field.",
	category: "product",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Shoppers lack the information needed to evaluate and purchase the product.",
	alert: "Add a complete, customer-focused description to each affected product.",
	tone: "warning",

	check(products) {
		return products.filter((product) => !product.description?.trim())
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Missing Description"
			}));
	},
};
