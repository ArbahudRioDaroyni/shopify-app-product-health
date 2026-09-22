export const excessiveWhitespace = {
	id: "excessive-whitespace",
	name: "Excessive Whitespace",
	summary: "Product descriptions contain excessive spacing or empty lines.",
	description: "Product descriptions containing repetitive empty lines or excessive spacing, leading to unformatted storefront layouts.",
	category: "content",
	severity: "LOW",
	priority: "improvement",
	impact: "Can make product pages look unpolished and harder to read.",
	alert: "Clean up spacing and empty lines in each affected description.",
	tone: "info",

	check(products) {
		// Pattern detects:
		// 1. Sequences of 2 or more spaces/tabs/newlines: \s{2,}
		// 2. Sequences of 2 or more &nbsp; entities: (?:&nbsp;){2,}
		// 3. Spaces at the beginning/end of the string: ^\s+|\s+$
		const excessiveWhitespacePattern = /\s{2,}|(?:&nbsp;){2,}|^\s+|\s+$/i;

		return products.filter((product) => excessiveWhitespacePattern.test(product.descriptionHtml || ""))
			.map((product) => ({
				productId: product.id,
				productLegacyResourceId: product.legacyResourceId || null,
				productTitle: product.title,
				variantId: null,
				variantLegacyResourceId: null,
				variantTitle: null,
				status: product.status,
        featuredImage: product.featuredImage || null,
				issue: "Excessive Whitespace"
			}));
	},
};
