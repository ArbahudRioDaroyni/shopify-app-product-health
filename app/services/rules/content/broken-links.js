export const brokenLinks = {
	id: "broken-links",
	name: "Broken Links",
	summary: "Product descriptions contain invalid or unreachable links.",
	description: "Product descriptions containing broken or unreachable URLs, which degrades customer trust and SEO authority.",
	category: "content",
	severity: "MEDIUM",
	priority: "needs_attention",
	impact: "Damages shopper trust and can weaken the page's SEO quality.",
	alert: "Update or remove each broken link in the affected descriptions.",
	tone: "warning",

	check(products) {
		const brokenLinkPattern = /href=["']\s*(?:#(?:[^\s"'<>]*)?|javascript:[^"']*|mailto:|tel:|\?|http:\/?\/?|https:\/?\/?|\.\.?\/?)\s*["']/i;
		return products.filter((product) => brokenLinkPattern.test(product.descriptionHtml || ""))
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
        featuredImage: product.featuredImage || null,
				issue: "Broken Links"
			}));
	}
};
