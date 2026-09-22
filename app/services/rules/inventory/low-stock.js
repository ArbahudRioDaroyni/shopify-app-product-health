const threshold = 5;
export const lowStock = {
	id: "low-stock",
	name: "Low Stock",
	summary: "Variants are close to running out of inventory.",
	description: `Variants with ${threshold} or fewer units remaining, requiring stock replenishment.`,
	category: "inventory",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Risks stockouts and missed sales if inventory is not replenished soon.",
	alert: "Review demand and replenish inventory for affected variants.",
	tone: "warning",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => variant.inventoryQuantity !== undefined && variant.inventoryQuantity > 0 && variant.inventoryQuantity <= threshold)
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Low Stock"
			})));
	},
};
