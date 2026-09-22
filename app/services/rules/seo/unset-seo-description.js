export const unsetSeoDescription = {
	id: "unset-seo-description",
	name: "Unset SEO Description",
	summary: "Products do not have a custom SEO description.",
	description: "Products without a custom meta description, forcing search engines to display fallback text.",
	category: "seo",
	severity: "LOW",
	priority: "improvement",
	impact: "Search engines may show less persuasive fallback text in result pages.",
	alert: "Add a clear, benefit-led SEO description to each affected product.",
	tone: "info",

	check(products) {
		return products.filter((product) => !product.seo?.description?.trim())
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Unset SEO Description"
			}));
	},
};
