export const missingBarcode = {
	id: "missing-barcode",
	name: "Missing Barcode",
	summary: "Variants are missing a GTIN or UPC barcode.",
	description: "Variants missing GTIN/UPC barcodes required for Google Shopping and sales channel integrations.",
	category: "variant",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Can block product listings and inventory synchronization in sales channels.",
	alert: "Add the correct GTIN or UPC barcode to each affected variant.",
	tone: "warning",

	check(products) {
		const missingBarcode = [];
		for (const product of products) {
			for (const variant of product.variants.nodes) {
				if (!variant.barcode?.trim()) {
					missingBarcode.push({
						productId: product.id,
						productLegacyResourceId: product.legacyResourceId || null,
						productTitle: product.title,
						variantId: variant.id,
						variantLegacyResourceId: variant.legacyResourceId || null,
						variantTitle: variant.title,
						status: product.status,
						featuredImage: product.featuredImage || null,
						issue: "Missing Barcode"
					});
				}
			}
		}
		return missingBarcode;
	},
};
