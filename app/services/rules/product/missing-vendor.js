export const missingVendor = {
	id: "missing-vendor",
	name: "Missing Vendor",
	summary: "Products do not have a vendor or brand assigned.",
	description: "Products without an assigned vendor or brand name.",
	category: "product",
	severity: "LOW",
	priority: "improvement",
	impact: "Reduces brand clarity and limits vendor-based filtering and reporting.",
	alert: "Assign the appropriate vendor or brand to each affected product.",
	tone: "info",

	check(products) {
		return products.filter((product) => !product.vendor?.trim())
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
				featuredImage: product.featuredImage || null,
				issue: "Missing Vendor"
			}));
	},
};
