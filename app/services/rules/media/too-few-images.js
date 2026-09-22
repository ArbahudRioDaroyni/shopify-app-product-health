const minimumImages = 2;
export const tooFewImages = {
	id: "too-few-images",
	name: "Too Few Images",
	summary: "Products have fewer images than the recommended minimum.",
	description: `Products with fewer than ${minimumImages} images, providing insufficient visual context for shoppers.`,
	category: "media",
	severity: "LOW",
	priority: "improvement",
	impact: "Gives shoppers limited visual information and may reduce conversion.",
	alert: "Add more useful product images that show key details and angles.",
	tone: "info",

	check(products) {
		return products.filter((product) => {
			const images = product.media?.nodes?.filter((media) => media.image) || [];
			return images.length > 0 && images.length < minimumImages;
		}).map((product) => ({
			productId: product.id,
			productLegacyResourceId: product.legacyResourceId || null,
			productTitle: product.title,
			variantId: null,
			variantLegacyResourceId: null,
			variantTitle: null,
			status: product.status,
			featuredImage: product.featuredImage || null,
			issue: "Too Few Images"
		}));
	},
};
