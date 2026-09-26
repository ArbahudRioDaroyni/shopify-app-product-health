import db from "../../db.server.js";

export const GET_PRODUCTS_BY_IDS_QUERY = `#graphql
  query GetProductsDetailsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
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

        collections(first: 100) {
          nodes {
            id
            title
          }
        }

        variants(first: 100) {
          nodes {
            id
            legacyResourceId
            sku
          }
        }
      }
    }
  }
`;

/**
 * Retrieves details for multiple products at once based on an array of product IDs
 * @param {object} options - Options object
 * @param {object} options.admin - Shopify Admin API context
 * @param {Array<string|number>} [options.productIds=[]] - Array containing product IDs (can be standard IDs or GIDs)
 * @returns {Promise<Array<object>>} Array of product detail objects (elements are null if the ID is not found)
 */
export async function getProductsDetailsByIds({ admin, productIds = [] } = {}) {
  if (!productIds || productIds.length === 0) {
    return [];
  }

  // Format all IDs in the array into Shopify Global ID (GID) format
  const gidFormat = "gid://shopify/Product/";
  const gids = productIds.map((id) =>
    String(id).includes("gid://shopify/Product/")
      ? String(id)
      : `${gidFormat}${id}`
  );

  const response = await admin.graphql(GET_PRODUCTS_BY_IDS_QUERY, {
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

  // data.data.nodes returns an array of products matching the order of the submitted `ids` 
  // Filters out nulls if any IDs are invalid or not found in Shopify
  const products = (data.data?.nodes || []).filter(Boolean);

  return products;
}

/**
 * Retrieves a paginated list of stored products for a shop together with their
 * unique issue count. The issue count combines the issues attached directly to
 * the product with the issues attached to any of its variants, de-duplicated so
 * the same issue (e.g. a duplicate image rule hitting 2 variants) counts once.
 *
 * Only non-deprecated columns are returned (`id`, `createdAt`); titles, SKUs,
 * images and collections are resolved from Shopify by the caller.
 *
 * @param {object} options - Options object
 * @param {number} options.shopId - Internal shop ID owning the products
 * @param {number} [options.page=1] - One-based page number
 * @param {number} [options.pageSize=10] - Number of products per page
 * @returns {Promise<{data: Array<object>, count: number, page: number, pageSize: number, totalPages: number}>}
 */
export async function getAllProduct({ shopId, page = 1, pageSize = 10 } = {}) {
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safePageSize = Math.max(parseInt(pageSize, 10) || 10, 1);
  const skip = (safePage - 1) * safePageSize;

  const where = { shopId };

  const [products, count] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: safePageSize,
      select: {
        id: true,
        shopId: true,
        createdAt: true,
        productIssues: {
          select: {
            issueId: true,
          },
        },
        variants: {
          select: {
            id: true,
            variantIssues: {
              select: {
                issueId: true,
              },
            },
          },
        },
      },
    }),
    db.product.count({ where }),
  ]);

  const data = products.map((product) => {
    /** Unique issue IDs found both on the product itself and on its variants. */
    const issueIds = new Set();

    (product.productIssues || []).forEach((productIssue) => {
      if (productIssue.issueId !== null && productIssue.issueId !== undefined) {
        issueIds.add(productIssue.issueId);
      }
    });

    (product.variants || []).forEach((variant) => {
      (variant.variantIssues || []).forEach((variantIssue) => {
        if (variantIssue.issueId !== null && variantIssue.issueId !== undefined) {
          issueIds.add(variantIssue.issueId);
        }
      });
    });

    return {
      id: product.id,
      shopId: product.shopId,
      createdAt: product.createdAt,
      issueCount: issueIds.size,
    };
  });

  return {
    data,
    count,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(Math.ceil(count / safePageSize), 1),
  };
}

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