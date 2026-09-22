export const GET_PRODUCTS = `#graphql
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        id
        legacyResourceId
        title
        description
        descriptionHtml
        status
        productType
        vendor
        tags

        category {
          id
          name
        }

        collections(first: 100) {
          nodes {
            id
            title
            handle
          }
        }

        featuredImage {
          id
          url(transform: { maxWidth: 40, maxHeight: 40 })
          altText
        }

        media(first: 100) {
          nodes {
            id

            ... on MediaImage {
              image {
                url
                altText
              }
            }
          }
        }

        variants(first: 100) {
          nodes {
            id
            legacyResourceId
            title
            sku
            barcode
            inventoryQuantity
            price
            compareAtPrice

            inventoryItem {
              tracked
              duplicateSkuCount
              measurement {
                weight {
                  value
                  unit
                }
              }
            }
          }
        }

        seo {
          title
          description
        }
      }

      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function getProducts(admin) {
  const products = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const response = await admin.graphql(GET_PRODUCTS, {
      variables: {
        first: 100,
        after: cursor,
      },
    });

    const data = await response.json();
    const productConnection = data.data.products;
    products.push(...productConnection.nodes);

    hasNextPage = productConnection.pageInfo.hasNextPage;
    cursor = productConnection.pageInfo.endCursor;
  }

  return products;
}

export const GET_PRODUCT_BY_ID_QUERY = `#graphql
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      legacyResourceId
      title
      description
      descriptionHtml
      status
      productType
      vendor
      tags

      category {
        id
        name
      }

      collections(first: 100) {
        nodes {
          id
          title
          handle
        }
      }

      featuredImage {
        id
        url(transform: { maxWidth: 150, maxHeight: 150 })
        altText
      }

      media(first: 100) {
        nodes {
          id

          ... on MediaImage {
            image {
              id
              url
              altText
            }
          }
        }
      }

      variants(first: 100) {
        nodes {
          id
          legacyResourceId
          title
          sku
          barcode
          inventoryQuantity
          price
          compareAtPrice

          inventoryItem {
            tracked
            duplicateSkuCount
            measurement {
              weight {
                value
                unit
              }
            }
          }
        }
      }

      seo {
        title
        description
      }
    }
  }
`;

export async function getProductById(admin, productId) {
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

export const GET_VARIANT_BY_ID_QUERY = `#graphql
  query GetVariantById($id: ID!) {
    productVariant(id: $id) {
      id
      legacyResourceId
      title
      sku
      barcode
      inventoryQuantity
      price
      compareAtPrice

      inventoryItem {
        tracked
        duplicateSkuCount

        measurement {
          weight {
            value
            unit
          }
        }
      }

      product {
        id
        legacyResourceId
        title
        status
        productType
        vendor

        featuredImage {
          id
          url(transform: { maxWidth: 150, maxHeight: 150 })
          altText
        }
      }
    }
  }
`;

export async function getVariantById(admin, variantId) {
  const gidFormat = "gid://shopify/ProductVariant"
  const gid = variantId.includes(gidFormat) ? variantId : `gid://shopify/ProductVariant/${variantId}`;

  const response = await admin.graphql(GET_VARIANT_BY_ID_QUERY, {
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
  // return gid;
}