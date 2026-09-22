export const priceIsZero = {
	id: "price-is-zero",
	name: "Price Is Zero",
	summary: "Variants are priced at zero without an intentional promotion.",
	description: "Variants priced at 0.00 without an intentional free-gift promotion.",
	category: "pricing",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "May result in unintended free orders and lost revenue.",
	alert: "Confirm free items are intentional or set the correct selling price.",
	tone: "warning",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => Number(variant.price) === 0)
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Price is Zero"
			}))
		);
	},
};
