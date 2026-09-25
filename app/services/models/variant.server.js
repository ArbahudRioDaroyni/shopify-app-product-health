/** Slim variant query used by the issue variant popover. */
export const GET_VARIANT_DETAILS_BY_ID_QUERY = `#graphql
  query GetVariantDetailsById($id: ID!) {
    productVariant(id: $id) {
      id
      legacyResourceId
      title
      sku
      price
      compareAtPrice
      inventoryQuantity
      image {
        id
        altText
        url(transform: { maxWidth: 40, maxHeight: 40 })
      }
      product {
        id
        legacyResourceId
        title
        status
      }
    }
  }
`;

/** Fetches the slim variant details for a legacy variant ID or GID. */
export async function getVariantDetailsById(admin, variantId) {
	const gidFormat = "gid://shopify/ProductVariant"
	const gid = variantId.includes(gidFormat) ? variantId : `gid://shopify/ProductVariant/${variantId}`;

	const response = await admin.graphql(GET_VARIANT_DETAILS_BY_ID_QUERY, {
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

	return data.data.productVariant;
}

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