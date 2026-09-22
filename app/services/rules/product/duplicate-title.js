export const duplicateTitle = {
	id: "duplicate-title",
	name: "Duplicate Title",
	summary: "Multiple products use the same title.",
	description: "Multiple products sharing identical titles, leading to customer confusion and keyword cannibalization.",
	category: "product",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Can confuse shoppers and make products compete with each other in search results.",
	alert: "Give each affected product a distinct, descriptive title.",
	tone: "warning",

	check(products) {
		const titles = new Map();

		// 1. Group products by title
		for (const product of products) {
			const title = product.title?.trim().toLowerCase();
			if (!title) continue;

			if (!titles.has(title)) {
				titles.set(title, []);
			}
			titles.get(title).push(product);
		}

		// 2. Filter groups with a count > 1 and map the results.
		const results = [];

		for (const items of titles.values()) {
			if (items.length > 1) {
				items.forEach((product) => {
					// Retrieve the `legacyResourceId` for all competing products with the same title (excluding this product itself).
					const compareIds = items
						.filter((item) => item.id !== product.id)
						.map((item) => {
							return { product: item.legacyResourceId }
						});

					results.push({
						productId: product.id,
						productLegacyResourceId: product.legacyResourceId || null,
						productTitle: product.title,
						variantId: null,
						variantLegacyResourceId: null,
						variantTitle: null,
						status: product.status,
						featuredImage: product.featuredImage || null,
						issue: "Duplicate Title",
						details: compareIds
					});
				});
			}
		}

		return results;
	},
};
