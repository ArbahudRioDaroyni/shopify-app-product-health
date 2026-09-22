const maximumLength = 70;
export const longSeoTitle = {
	id: "long-seo-title",
	name: "Long SEO Title",
	summary: "Custom SEO titles exceed the recommended length.",
	description: `Custom SEO titles exceeding ${maximumLength} characters, which may get truncated in search engine result pages (SERPs).`,
	category: "seo",
	severity: "LOW",
	priority: "improvement",
	impact: "Search engines may truncate important words in the search result title.",
	alert: "Shorten each SEO title so its key message appears before truncation.",
	tone: "info",

	check(products) {
		return products.filter((product) => product.seo?.title?.trim().length > maximumLength)
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Long SEO Title",
			}));
	},
};
