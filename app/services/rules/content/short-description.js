const minimumLength = 70;
export const shortDescription = {
	id: "short-description",
	name: "Short Description",
	summary: "Product descriptions are shorter than the recommended length.",
	description: `Product descriptions shorter than ${minimumLength} characters, which may fail to inform buyers and hinder SEO performance.`,
	category: "product",
	severity: "LOW",
	priority: "improvement",
	impact: "May leave shoppers underinformed and reduce the product page's search relevance.",
	alert: "Expand each description with useful product details and benefits.",
	tone: "info",

	check(products) {
		return products.filter((product) => {
			const description = product.description?.replace(/<[^>]*>/g, "").trim();
			return description && description.length < minimumLength;
		}).map((product) => ({
			productId: product.id,
			productLegacyResourceId: product.legacyResourceId || null,
			productTitle: product.title,
			variantId: null,
			variantLegacyResourceId: null,
			variantTitle: null,
			status: product.status,
			featuredImage: product.featuredImage || null,
			issue: "Short Description"
		}));
	},
};
