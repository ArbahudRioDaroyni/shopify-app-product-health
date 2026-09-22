export const invalidCompareAtPrice = {
	id: "invalid-compare-at-price",
	name: "Invalid Compare-at Price",
	summary: "Compare-at prices are not higher than the current selling price.",
	description: "Compare-at price that is lower than, or equal to, the current selling price.",
	category: "pricing",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Can display misleading discounts or prevent sale pricing from appearing correctly.",
	alert: "Set a compare-at price higher than the current selling price, or remove it.",
	tone: "warning",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => {
				const compareAtPrice = Number(variant.compareAtPrice);
				const price = Number(variant.price);
				return variant.compareAtPrice !== undefined && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0 || compareAtPrice < price);
			})
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Invalid Compare-at Price"
			}))
		);
	},
};
