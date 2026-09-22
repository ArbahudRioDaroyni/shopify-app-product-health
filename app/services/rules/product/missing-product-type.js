export const missingProductType = {
	id: "missing-product-type",
	name: "Missing Product Type",
	summary: "Products do not have a defined product type.",
	description: "Products without a defined product type, hindering automated collection grouping.",
	category: "product",
	severity: "LOW",
	priority: "improvement",
	impact: "Limits automated collection rules, filtering, and catalog reporting.",
	alert: "Set a consistent product type for each affected product.",
	tone: "info",

	check(products) {
		return products.filter((product) => !product.productType?.trim())
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Missing Product Type"
			}));
	},
};
