export async function upsertProduct({db, item}) {
	const productTitle = item.productTitle || "Untitled Product";
	const productId = String(item.productLegacyResourceId || item.productId);

  const data = await db.product.upsert({
    where: { id: productId },
    update: {
      title: productTitle,
      status: item.status || "ACTIVE",
      featuredImage: JSON.stringify(item.featuredImage) || null,
    },
    create: {
      id: productId,
      title: productTitle,
      status: item.status || "ACTIVE",
      featuredImage: JSON.stringify(item.featuredImage) || null,
    },
  });

	return data;
}

export async function upsertProductIssue({db, product, issue, issueDetails}) {
	const data = await db.productIssue.upsert({
		where: {
			productId_issueId: {
				productId: product.id,
				issueId: issue.id,
			},
		},
		update: { details: issueDetails },
		create: {
			productId: product.id,
			issueId: issue.id,
			details: issueDetails
		},
	});

	return data;
}