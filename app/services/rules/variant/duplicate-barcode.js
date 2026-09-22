export const duplicateBarcode = {
	id: "duplicate-barcode",
	name: "Duplicate Barcode",
	summary: "Multiple variants share the same barcode.",
	description: "Barcodes shared across different variants, breaking POS scanning and inventory sync.",
	category: "variant",
	severity: "HIGH",
	priority: "critical",
	impact: "Can cause POS scanning errors and inventory synchronization conflicts.",
	alert: "Correct duplicate barcodes before they affect sales or inventory operations.",
	tone: "critical",

	check(products) {
		const barcodesMap = new Map();

		// 1. Group variants by barcode
		for (const product of products) {
			if (!product) continue;

			const variantsList = Array.isArray(product.variants)
				? product.variants
				: product.variants?.nodes || product.variants?.edges?.map((e) => e.node) || [];

			for (const variant of variantsList) {
				if (!variant) continue;

				const barcode = typeof variant.barcode === "string" ? variant.barcode.trim() : null;
				if (!barcode) continue;

				if (!barcodesMap.has(barcode)) {
					barcodesMap.set(barcode, []);
				}
				barcodesMap.get(barcode).push({ product, variant });
			}
		}

		// 2. Filter duplicate barcode groups (> 1) and format the return value
		const results = [];

		for (const items of barcodesMap.values()) {
			if (items.length > 1) {
				items.forEach(({ product, variant }) => {
					// Get the legacyResourceId (or ID) from the opposing variant that has the same barcode
					const compareLegacyIds = items
						.filter((item) => item.variant.id !== variant.id)
						.map((item) => {
							return {
								product: item.product.legacyResourceId,
								variant: item.variant.legacyResourceId
							}
						});

					results.push({
						productId: product.id,
						productLegacyResourceId: product.legacyResourceId || null,
						productTitle: product.title,
						variantId: variant.id,
						variantLegacyResourceId: variant.legacyResourceId || null,
						variantTitle: variant.title,
						status: product.status,
						featuredImage: product.featuredImage || null,
						issue: "Duplicate Barcode",
						details: compareLegacyIds
					});
				});
			}
		}

		return results;
	},
};
