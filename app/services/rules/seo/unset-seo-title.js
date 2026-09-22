export const unsetSeoTitle = {
	id: "unset-seo-title",
	name: "Unset SEO Title",
	summary: "Products do not have a custom SEO title.",
	description: "Products without a custom meta title, defaulting to standard product titles in search engines.",
	category: "seo",
	severity: "LOW",
	priority: "improvement",
	impact: "Search listings may be less compelling and less targeted to relevant keywords.",
	alert: "Write a concise, keyword-focused SEO title for each affected product.",
	tone: "info",

	check(products) {
		return products.filter((product) => !product.seo?.title?.trim())
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "unset SEO Title"
			}));
	},
};
