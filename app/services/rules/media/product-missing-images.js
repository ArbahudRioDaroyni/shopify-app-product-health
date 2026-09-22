export const productMissingImages = {
	id: "product-missing-images",
	name: "Product Missing Images",
	summary: "Products do not have any images or media.",
	description: "Products without any media or images, severely reducing buyer trust and conversion rates.",
	category: "media",
	severity: "HIGH",
	priority: "critical",
	impact: "Severely reduces shopper confidence and the likelihood of conversion.",
	alert: "Add clear product images before offering these products for sale.",
	tone: "critical",

	check(products) {
		return products.filter((product) => {
			return !product.media?.nodes?.length;
		}).map((product) => ({
			productId: product.id,
			productLegacyResourceId: product.legacyResourceId || null,
			productTitle: product.title,
			variantId: null,
			variantLegacyResourceId: null,
			variantTitle: null,
			status: product.status,
			featuredImage: product.featuredImage || null,
			issue: "Product Missing Images"
		}));
	},
};
