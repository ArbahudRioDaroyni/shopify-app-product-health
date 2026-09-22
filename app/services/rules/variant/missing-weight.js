export const missingWeight = {
	id: "missing-weight",
	name: "Missing Weight",
	summary: "Physical variants do not have a valid weight.",
	description: "Physical variants without assigned weight, leading to inaccurate carrier shipping rate calculations at checkout.",
	category: "variant",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Can produce inaccurate carrier-calculated shipping rates at checkout.",
	alert: "Add an accurate weight to every physical variant.",
	tone: "warning",

	check(products) {
		return products.flatMap((product) => (product.variants?.nodes || [])
			.filter((variant) => {
				const weight = variant.inventoryItem.measurement.weight.value;
				return weight === undefined || weight === null || Number(weight) <= 0
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
				issue: "Missing Weight"
			}))
		);
	},
};
