export const outOfStock = {
	id: "out-of-stock",
	name: "Out of Stock",
	summary: "Variants have no inventory remaining.",
	description: "Variants with zero inventory, leading to missed conversion opportunities.",
	category: "inventory",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Creates missed sales opportunities and can frustrate returning shoppers.",
	alert: "Replenish stock or adjust product availability for affected variants.",
	tone: "warning",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => variant.inventoryQuantity !== undefined && variant.inventoryQuantity <= 0)
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Out of Stock"
			})));
	},
};
