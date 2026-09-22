export const missingPrice = {
	id: "missing-price",
	name: "Missing Price",
	summary: "Variants do not have a selling price.",
	description: "Variants without a defined selling price, preventing checkout.",
	category: "pricing",
	severity: "HIGH",
	priority: "critical",
	impact: "Prevents customers from completing checkout for affected variants.",
	alert: "Set a valid selling price before making these variants available for sale.",
	tone: "critical",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => variant.price === undefined || variant.price === null || variant.price === "")
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Missing Price"
			})));
	},
};
