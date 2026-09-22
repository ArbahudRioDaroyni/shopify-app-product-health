export const inventoryNotTracked = {
	id: "inventory-not-tracked",
	name: "Inventory Not Tracked",
	summary: "Variants do not have inventory tracking enabled.",
	description: "Variants without inventory tracking enabled, risking overselling or untracked stock levels.",
	category: "inventory",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Increases the risk of overselling and makes stock levels unreliable.",
	alert: "Enable inventory tracking where stock levels need to be controlled.",
	tone: "warning",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => !variant.inventoryItem.tracked)
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Inventory Not Tracked"
			}))
		);
	},
};
