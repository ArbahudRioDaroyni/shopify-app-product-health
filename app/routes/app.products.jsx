import { useEffect, useState } from "react";
import { useLoaderData, useNavigation, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getAllProduct,
  getProductsDetailsByIds,
} from "../services/models/product.server";
import { getOrCreateShop } from "../services/models/shop.server";
import { formatDateTime, toTitleCase } from "../utils/formatters";
import styles from "../styles.css?url";

/** Style sheet link descriptor consumed by React Router. */
export const links = () => [{ rel: "stylesheet", href: styles }];

/** Number of products rendered (and resolved from Shopify) per page. */
const PRODUCTS_PAGE_SIZE = 10;

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  /** Parsed request URL, used to read the pagination query param. */
  const url = new URL(request.url);
  /** Validated one-based page number. */
  const getPage = () => {
    const parsedPage = parseInt(url.searchParams.get("page") || "1", 10);
    return Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  };
  const page = getPage();

  /** Shop record the products belong to. */
  const shop = await getOrCreateShop({ admin });

  /** Paginated stored products, each with its unique issue count. */
  const { data: products, count, totalPages, pageSize } = await getAllProduct({
    shopId: shop.id,
    page,
    pageSize: PRODUCTS_PAGE_SIZE,
  });

  /**
   * Product IDs visible on this page only; keeps the Shopify round trip bounded
   * to `pageSize` IDs instead of the whole catalog.
   */
  const productIds = products.map((product) => product.id);

  /** Shopify details (title, image, status, SKU, collections) for this page. */
  let shopifyProducts = [];
  try {
    shopifyProducts = await getProductsDetailsByIds({ admin, productIds });
  } catch (error) {
    // A Shopify failure should still render the stored rows rather than 500.
    console.error("Failed to load product details from Shopify", error);
  }

  /** Shopify products keyed by their legacy (database) product ID. */
  const shopifyProductById = shopifyProducts.reduce((accumulator, product) => {
    if (product?.legacyResourceId) {
      accumulator[String(product.legacyResourceId)] = product;
    }
    return accumulator;
  }, {});

  /** Flat rows combining the stored record with the Shopify details. */
  const rows = products.map((product) => {
    const shopifyProduct = shopifyProductById[String(product.id)] || null;

    /** First variant carrying a SKU; empty variants are ignored. */
    const variantWithSku = (shopifyProduct?.variants?.nodes || []).find(
      (variant) => variant?.sku,
    );

    /** Collection titles the product belongs to. */
    const collections = (shopifyProduct?.collections?.nodes || [])
      .map((collection) => collection?.title)
      .filter(Boolean);

    return {
      id: product.id,
      createdAt: product.createdAt,
      issueCount: product.issueCount,
      title: shopifyProduct?.title || null,
      status: shopifyProduct?.status || null,
      featuredImageUrl:
        shopifyProduct?.featuredMedia?.preview?.image?.url || null,
      featuredImageAlt:
        shopifyProduct?.featuredMedia?.preview?.image?.altText ||
        shopifyProduct?.featuredMedia?.alt ||
        null,
      sku: variantWithSku?.sku || null,
      collections,
    };
  });

  return { rows, page, pageSize, count, totalPages };
}
/** Products page: one table listing the paginated catalog with its issue counts. */
export default function Products() {
  /** Data returned by `loader`: the page rows plus the pagination state. */
  const { rows, page, pageSize, count, totalPages } = useLoaderData();
  /** Query string accessor pair; only the setter is used. */
  const [_searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  /** True while the loader for the latest page change is still running. */
  const isLoading = navigation.state === "loading";
  /** Page number shown in the pagination field; seeded from the loader data. */
  const [inputPage, setInputPage] = useState(String(page));

  /** Keeps the pagination field in sync after the loader resolves a new page. */
  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  /** Navigates to a valid page inside the available range. */
  const goToPage = (newPage) => {
    const pageNum = parseInt(newPage, 10);
    if (
      !Number.isNaN(pageNum) &&
      pageNum >= 1 &&
      pageNum <= totalPages &&
      pageNum !== page
    ) {
      setSearchParams(
        (params) => {
          params.set("page", String(pageNum));
          return params;
        },
        { preventScrollReset: true },
      );
    } else {
      setInputPage(String(page));
    }
  };

  /** Applies the typed page immediately on Enter. */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      goToPage(inputPage);
    }
  };

  /** Applies the typed page when the field loses focus. */
  const handleBlur = () => {
    goToPage(inputPage);
  };

  /** Badge tone for the issue count, based on how many issues hit the product. */
  const getIssueTone = (issueCount) => {
    if (issueCount >= 5) return "critical";
    if (issueCount > 0) return "warning";
    return "neutral";
  };

  return (
    <s-page
      heading="All Products"
      inlineSize="large"
      className="app-catalog-health"
      breadcrumbs={[{ content: "Product", url: "/app/products" }]}
    >
      <s-query-container containerName="product-details">
        <s-section padding="none">
          {/* Table stays mounted while the loader re-runs on page change. */}
          <s-table
            loading={isLoading}
            variant="@container product-details (inline-size <= 600px) list, table"
          >
            <s-table-header-row>
              <s-table-header listSlot="primary">
                <s-stack paddingBlock="small-300" paddingInline="large-500">
                  <s-text>Product</s-text>
                </s-stack>
              </s-table-header>
              <s-table-header listSlot="secondary">Status</s-table-header>
              <s-table-header listSlot="secondary">SKU</s-table-header>
              <s-table-header listSlot="secondary">Collection</s-table-header>
              <s-table-header listSlot="labeled">Issue</s-table-header>
              <s-table-header listSlot="kicker">Last scan</s-table-header>
              <s-table-header listSlot="inline">Action</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {rows.length > 0 ? (
                rows.map((product) => (
                  <s-table-row key={product.id}>

                    {/* Featured image + title resolved from Shopify. */}
                    <s-table-cell>
                      <s-stack
                        direction="inline"
                        alignItems="center"
                        gap="small-200"
                      >
                        <s-thumbnail
                          src={product.featuredImageUrl || undefined}
                          alt={product.featuredImageAlt || "Product image"}
                          size="small"
                        />
                        <s-box inlineSize="300px">
                          <s-paragraph lineClamp={2}>
                            {product.title || product.id}
                          </s-paragraph>
                        </s-box>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      {product.status ? (
                        <s-badge
                          tone={
                            product.status === "ACTIVE" ? "success" : "neutral"
                          }
                        >
                          {toTitleCase(product.status)}
                        </s-badge>
                      ) : null}
                    </s-table-cell>
                    {/* First variant SKU carried by the product. */}
                    <s-table-cell>
                      <s-text>{product.sku || "-"}</s-text>
                    </s-table-cell>
                    {/* Every collection the product belongs to. */}
                    <s-table-cell>
                      {product.collections.length > 0 ? (
                        <s-stack direction="inline" gap="small-200">
                          {product.collections.map((collection) => (
                            <s-chip
                              key={`${product.id}-${collection}`}
                              color="subdued"
                              accessibilityLabel={collection}
                            >
                              {collection}
                            </s-chip>
                          ))}
                        </s-stack>
                      ) : (
                        <s-text>-</s-text>
                      )}
                    </s-table-cell>
                    {/* Unique issue count across the product and its variants. */}
                    <s-table-cell>
                      <s-badge
                        tone={getIssueTone(product.issueCount)}
                        accessibilityLabel={`${product.issueCount} issue found`}
                      >
                        {product.issueCount}
                      </s-badge>
                    </s-table-cell>
                    {/* Stored product creation date, used as the last scan time. */}
                    <s-table-cell>
                      <s-text>{formatDateTime(product.createdAt)}</s-text>
                    </s-table-cell>
                    {/* Placeholder: the target link is added later. */}
                    <s-table-cell>
                      <s-button
                        icon="view"
                        variant="tertiary"
                        accessibilityLabel="Preview product"
                        disabled
                      ></s-button>
                    </s-table-cell>
                  </s-table-row>
                ))
              ) : (
                /* Shown when the shop has no stored products yet. */
                <s-table-row>
                  <s-table-cell>{`No products found.`}</s-table-cell>
                </s-table-row>
              )}
            </s-table-body>
          </s-table>

          {totalPages > 1 && (
            <s-stack
              direction="inline"
              alignItems="center"
              justifyContent="end"
              gap="base"
              padding="base"
            >
              <s-button
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </s-button>

              <s-grid
                gridTemplateColumns="auto 1fr auto"
                gap="small"
                alignItems="center"
              >
                <s-text>Page</s-text>
                <s-text-field
                  type="number"
                  min={1}
                  max={totalPages}
                  value={inputPage}
                  disabled={isLoading}
                  onInput={(e) => setInputPage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  style={{ width: "60px" }}
                ></s-text-field>
                <s-text>of {totalPages}</s-text>
              </s-grid>

              <s-button
                disabled={page >= totalPages || isLoading}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </s-button>
            </s-stack>
          )}
        </s-section>
      </s-query-container>
      <s-section heading="product">
        <s-paragraph>
          <pre>{JSON.stringify({ count, page, pageSize, rows }, null, 2)}</pre>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

