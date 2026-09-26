export const GET_VARIANTS_BY_IDS_QUERY = `#graphql
  query GetVariantsDetailsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        legacyResourceId
        title

				media(first: 1) {
					nodes {
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

        product {
          id
          legacyResourceId
          title
          status
        }
      }
    }
  }
`;

/**
 * Retrieves slim variant details for multiple variants at once based on an array of variant IDs
 * @param {object} options - Options object
 * @param {object} options.admin - Shopify Admin API context
 * @param {Array<string|number>} [options.variantIds=[]] - Array containing variant IDs (can be standard IDs or GIDs)
 * @returns {Promise<Array<object>>} Array of variant detail objects (elements are null if the ID is not found)
 */
export async function getVariantsDetailsByIds({ admin, variantIds = [] } = {}) {
  if (!variantIds || variantIds.length === 0) {
    return [];
  }

  // Format all IDs in the array into Shopify Global ID (GID) format
  const gidFormat = "gid://shopify/ProductVariant/";
  const gids = variantIds.map((id) =>
    String(id).includes("gid://shopify/ProductVariant/")
      ? String(id)
      : `${gidFormat}${id}`
  );

  const response = await admin.graphql(GET_VARIANTS_BY_IDS_QUERY, {
    variables: {
      ids: gids,
    },
  });

  const data = await response.json();

  if (data.errors) {
    throw new Error(
      data.errors.map((error) => error.message).join(", ")
    );
  }

	// data.data.nodes returns an array of variants corresponding to the order of the submitted `ids`
	// Filters out nulls if any variant ID is invalid or not found
  const variants = (data.data?.nodes || []).filter(Boolean);

  return variants;
}

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
      
			media(first: 1) {
				nodes {
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