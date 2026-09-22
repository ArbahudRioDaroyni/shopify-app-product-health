export const placeholderContent = {
	id: "placeholder-content",
	name: "Placeholder Content",
	summary: "Products contain draft or placeholder copy.",
	description: "Products containing draft or lorem ipsum placeholder text in titles or descriptions.",
	category: "content",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Can reduce customer trust and make the storefront appear unfinished.",
	alert: "Replace placeholder text with accurate, customer-ready content.",
	tone: "warning",

	check(products) {
		// Array kata kunci dari Admin (bisa diubah-ubah)
		const placeholderList = [
			"lorem ipsum",
			"test",
			"sample",
			"demo",
			"draft",
			"untitled",
			"dummy",
			"insert text",
			"coming soon",
			"add description",
			"tba",
			"tbd",
			"text here"
		];

		if (!placeholderList.length) return [];

		// 1. Escape special regex characters if there is input such as "?" or "()" from the admin.
		const escapedKeywords = placeholderList.map(keyword =>
			keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		);

		// 2. Combine the array into a regex pattern with word boundaries (\b)
		// The result looks like this: /\b(lorem ipsum|test|sample|demo)\b/i
		const pattern = new RegExp(`\\b(${escapedKeywords.join('|')})\\b`, 'i');

		// 3. Filter products that have placeholder content in their title or descriptionHtml
		return products.filter((product) => {
			const title = product.title || "";
			const description = product.descriptionHtml || "";

			return pattern.test(title) || pattern.test(description);
		}).map((product) => ({
			productId: product.id,
			productLegacyResourceId: product.legacyResourceId || null,
			productTitle: product.title,
			variantId: null,
			variantLegacyResourceId: null,
			variantTitle: null,
			status: product.status,
			featuredImage: product.featuredImage || null,
			issue: "Placeholder Content"
		}));
	}
};
