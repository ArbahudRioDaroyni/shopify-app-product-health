export const GET_PRODUCT_BY_ID_QUERY = `#graphql
  query GetProductDetailsById($id: ID!) {
    product(id: $id) {
      id
      legacyResourceId
      title
      status
			
			featuredMedia {
				id
				alt
				mediaContentType
				preview {
					image {
						id
						altText
						url(transform: { maxWidth: 40, maxHeight: 40 })
					}
				}
				status
			}
    }
  }
`;

export async function getProductDetailsById(admin, productId) {
	const gidFormat = "gid://shopify/Product"
	const gid = productId.includes(gidFormat) ? productId : `gid://shopify/Product/${productId}`;

	const response = await admin.graphql(GET_PRODUCT_BY_ID_QUERY, {
		variables: {
			id: gid,
		},
	});

	const data = await response.json();

	if (data.errors) {
		throw new Error(
			data.errors.map((error) => error.message).join(", ")
		);
	}

	return data.data.product;
}

export async function upsertProduct({ db, shopId, item }) {
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

export async function upsertProductIssue({ db, shopId, product, issue, issueDetails }) {
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