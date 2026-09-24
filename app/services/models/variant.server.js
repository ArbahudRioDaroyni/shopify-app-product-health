export async function upsertVariant({db, shopId, item, product}) {
	const variantTitle = item.variantTitle || "Default Title";
	const variantId = String(item.variantLegacyResourceId || item.variantId);

	const data = await db.variant.upsert({
			where: {
				id_shopId: {
					id: variantId,
					shopId: shopId
				}
			},
			update: { title: variantTitle },
			create: {
				id: variantId,
				shopId: shopId,
				productId: product.id,
				title: variantTitle,
			},
		});

	return data;
}

export async function upsertVariantIssue({db, shopId, variant, issue, issueDetails}) {
	const data = await db.variantIssue.upsert({
		where: {
			shopId_variantId_issueId: {
				shopId: shopId,
				variantId: variant.id,
				issueId: issue.id,
			},
		},
		update: { details: issueDetails },
		create: {
			shopId: shopId,
			variantId: variant.id,
			issueId: issue.id,
			details: issueDetails
		},
	});

	return data;
}