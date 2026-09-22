export async function upsertVariant({db, item, product}) {
	const variantTitle = item.variantTitle || "Default Title";
	const variantId = String(item.variantLegacyResourceId || item.variantId);

  const data = await db.variant.upsert({
      where: { id: variantId },
      update: { title: variantTitle },
      create: {
        id: variantId,
        productId: product.id,
        title: variantTitle,
      },
    });

	return data;
}

export async function upsertVariantIssue({db, variant, issue, issueDetails}) {
	const data = await db.variantIssue.upsert({
		where: {
			variantId_issueId: {
				variantId: variant.id,
				issueId: issue.id,
			},
		},
		update: { details: issueDetails },
		create: {
			variantId: variant.id,
			issueId: issue.id,
			details: issueDetails
		},
	});

	return data;
}