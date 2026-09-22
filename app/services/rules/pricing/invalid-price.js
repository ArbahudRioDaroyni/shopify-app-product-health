export const invalidPrice = {
	id: "invalid-price",
	name: "Invalid Price",
	summary: "Variants have a malformed or negative selling price.",
	description: "Variants with non-numeric, malformed, or negative selling prices.",
	category: "pricing",
	severity: "HIGH",
	priority: "critical",
	impact: "Can prevent checkout or create incorrect charges for customers.",
	alert: "Replace each invalid price with a valid, non-negative amount.",
	tone: "critical",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => variant.price !== undefined && (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0))
			.map((variant) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: variant.id,
				variantLegacyResourceId: variant.legacyResourceId || null,
				variantTitle: variant.title,
				status: product.status,
				featuredImage: product.featuredImage || null,
				name: "Invalid Price"
			}))
		);
	},
};
