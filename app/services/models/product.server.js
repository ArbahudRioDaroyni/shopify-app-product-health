export async function upsertProduct({db, shopId, item}) {
	const productTitle = item.productTitle || "Untitled Product";
	const productId = String(item.productLegacyResourceId || item.productId);

  const data = await db.product.upsert({
    where: {
			id_shopId: {
				id: productId,
				shopId: shopId,
			}
		},
    update: {
      title: productTitle,
      status: item.status || "ACTIVE",
      featuredImage: JSON.stringify(item.featuredImage) || null,
    },
    create: {
      id: productId,
			shopId: shopId,
      title: productTitle,
      status: item.status || "ACTIVE",
      featuredImage: JSON.stringify(item.featuredImage) || null,
    },
  });

	return data;
}

export async function upsertProductIssue({db, shopId, product, issue, issueDetails}) {
	const data = await db.productIssue.upsert({
		where: {
			shopId_productId_issueId: {
				shopId: shopId,
				productId: product.id,
				issueId: issue.id,
			},
		},
		update: { details: issueDetails },
		create: {
			shopId: shopId,
			productId: product.id,
			issueId: issue.id,
			details: issueDetails
		},
	});

	return data;
}