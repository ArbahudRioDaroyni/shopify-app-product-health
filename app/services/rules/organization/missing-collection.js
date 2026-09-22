export const missingCollection = {
	id: "missing-collection",
	name: "Missing Collection",
	summary: "Products are not assigned to any collection.",
	description: "Products not assigned to any collection, making them harder to browse via navigation menus.",
	category: "organization",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Makes affected products harder for shoppers to discover through navigation.",
	alert: "Add each affected product to the most relevant collection.",
	tone: "warning",

	check(products) {
		return products.filter((product) => !product.collections?.nodes?.length)
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Missing Collection"
			}))
	},
};
