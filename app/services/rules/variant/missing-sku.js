export const missingSku = {
	id: "missing-sku",
	name: "Missing SKU",
	summary: "Variants are missing a stock-keeping unit identifier.",
	description: "Variants missing an SKU identifier, necessary for warehouse stock management.",
	category: "variant",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Makes warehouse operations, fulfillment, and inventory tracking less reliable.",
	alert: "Assign a unique SKU to each affected variant.",
	tone: "warning",

	check(products) {
		const missingSku = [];
		for (const product of products) {
			for (const variant of product.variants.nodes) {
				if (!variant.sku?.trim()) {
					missingSku.push({
						productId: product.id,
						productLegacyResourceId: product.legacyResourceId || null,
						productTitle: product.title,
						variantId: variant.id,
						variantLegacyResourceId: variant.legacyResourceId || null,
						variantTitle: variant.title,
						status: product.status,
						featuredImage: product.featuredImage || null,
						issue: "Missing SKU"
					});
				}
			}
		}
		return missingSku;
	},
};
