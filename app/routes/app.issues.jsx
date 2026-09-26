import { useEffect, useMemo, useRef, useState } from "react";
import {
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { authenticate } from "../shopify.server";
import { getIssues } from "../services/models/issue.server";
import { getOrCreateShop } from "../services/models/shop.server";
import { getProductsDetailsByIds } from "../services/models/product.server";
import { getVariantsDetailsByIds } from "../services/models/variant.server";
import { customDebounce, toTitleCase } from "../utils/formatters";
import ButtonFilter from "../components/button-filter";
import styles from "../styles.css?url";

/** Style sheet link descriptor consumed by React Router. */
export const links = () => [{ rel: "stylesheet", href: styles }];

/** Selectable product status values, validated by `loader` before the Prisma query. */
const PRODUCT_STATUS_FILTERS = ["all", "active", "draft", "archived"];

/** Selectable issue priority values, mapped by `getIssues` to the Prisma priority enum. */
const PRIORITY_FILTERS = ["all", "improvement", "needs_attention", "critical"];

/** Delay in milliseconds before buffered filter changes reach the URL and re-run the loader. */
const DEBOUNCE_DELAY = 500;

/** Form intent handled by `action` to resolve product details for a popover. */
const PRODUCT_DETAILS_INTENT = "product-details";

/** Form intent handled by `action` to resolve variant details for a popover. */
const VARIANT_DETAILS_INTENT = "variant-details";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === PRODUCT_DETAILS_INTENT) {
    /** Legacy product IDs, already de-duplicated on the client. */
    const productIds = JSON.parse(String(formData.get("productIds") || "[]"));

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return { products: [], variants: [] };
    }

    /** One bulk request for every ID instead of one request per ID. */
    const products = await getProductsDetailsByIds({ admin, productIds });

    return { products, variants: [] };
  }

  if (intent === VARIANT_DETAILS_INTENT) {
    /** Legacy variant IDs, already de-duplicated on the client. */
    const variantIds = JSON.parse(String(formData.get("variantIds") || "[]"));

    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return { products: [], variants: [] };
    }

    /** One bulk request for every ID instead of one request per ID. */
    const variants = await getVariantsDetailsByIds({ admin, variantIds });

    return { products: [], variants };
  }

  return { products: [], variants: [] };
}

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  /** Parsed request URL, used to read the filter query params. */
  const url = new URL(request.url);
  /** Free-text search term; empty string means no search. */
  const search = url.searchParams.get("search") || "";
  /** Selected issue priority; defaults to `all`. */
  const priority = url.searchParams.get("priority") || "all";
  /** Selected product status; defaults to `all`. */
  const productStatus = url.searchParams.get("status") || "all";

  /** Shop record the issues belong to. */
  const shop = await getOrCreateShop({ admin });
  /** Issues matching the current search, priority and product status filters. */
  const issues = await getIssues({
    shopId: shop.id,
    search,
    priority,
    productStatus,
  });

  return { issues, search, priority, productStatus };
}

/** Issues page: local state reacts instantly while the URL (and loader) is written debounced. */
export default function Issues() {
  /** Data returned by `loader`: the issues plus the active filters. */
  const { issues, search, priority, productStatus } = useLoaderData();
  /** Query string accessor pair; only the setter is used, through a ref. */
  const [_filterParams, setFilterParams] = useSearchParams();
  const navigation = useNavigation();
  /** True while the loader for the latest filter change is still running. */
  const isLoading = navigation.state === "loading";
  /** Search text displayed in the field; seeded from the loader data. */
  const [activeSearchFilter, setSearchFilter] = useState(String(search));

  /** Fetcher that POSTs the `product-details` intent when a product popover opens. */
  const productFetcher = useFetcher();
  /** Separate fetcher for the `variant-details` intent, so both popovers can load at once. */
  const variantFetcher = useFetcher({ key: VARIANT_DETAILS_INTENT });

  /** Only cache for product details, keyed by legacy product ID; lost on reload. */
  const [productDetailsById, setProductDetailsById] = useState({});

  /** Only cache for variant details, keyed by legacy variant ID; lost on reload. */
  const [variantDetailsById, setVariantDetailsById] = useState({});

  /** Holds the newest query string setter, which changes identity on every navigation. */
  const setFilterParamsRef = useRef(setFilterParams);
  useEffect(() => {
    setFilterParamsRef.current = setFilterParams;
  }, [setFilterParams]);

  /** Buffer of pending query string updates, keyed by param name. */
  const pendingParamsRef = useRef({});

  /** Debounced URL writer created once; merges buffered params into a single navigation. */
  const debouncedApplyParams = useMemo(
    () =>
      customDebounce(() => {
        const updates = pendingParamsRef.current;
        pendingParamsRef.current = {};

        const keys = Object.keys(updates);
        if (keys.length === 0) return;

        setFilterParamsRef.current(
          (params) => {
            keys.forEach((key) => params.set(key, String(updates[key])));
            return params;
          },
          { preventScrollReset: true },
        );
      }, DEBOUNCE_DELAY),
    [],
  );

  /** Cancels a pending flush when the component unmounts. */
  useEffect(() => () => debouncedApplyParams.cancel(), [debouncedApplyParams]);

  /** Merges resolved product details into `productDetailsById`. */
  useEffect(() => {
    const products = productFetcher.data?.products;
    if (!Array.isArray(products) || products.length === 0) return;

    setProductDetailsById((previous) => {
      const next = { ...previous };
      products.forEach((product) => {
        if (product?.legacyResourceId) {
          next[String(product.legacyResourceId)] = product;
        }
      });
      return next;
    });
  }, [productFetcher.data]);

  /** Merges resolved variant details into `variantDetailsById`. */
  useEffect(() => {
    const variants = variantFetcher.data?.variants;
    if (!Array.isArray(variants) || variants.length === 0) return;

    setVariantDetailsById((previous) => {
      const next = { ...previous };
      variants.forEach((variant) => {
        if (variant?.legacyResourceId) {
          next[String(variant.legacyResourceId)] = variant;
        }
      });
      return next;
    });
  }, [variantFetcher.data]);

  /** Buffers a query string change and schedules a debounced flush. */
  const queueParamUpdate = (key, value) => {
    pendingParamsRef.current = { ...pendingParamsRef.current, [key]: value };
    debouncedApplyParams();
  };

  /** Applies the search term immediately on Enter, bypassing the debounce. */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setFilterParams(
        (params) => {
          params.set("search", String(activeSearchFilter));
          return params;
        },
        { preventScrollReset: true },
      );
    }
  };

  /** Live search: updates the field instantly and debounces the `search` param. */
  const handleSearchInput = (value) => {
    setSearchFilter(value);
    queueParamUpdate("search", value);
  };

  /** Keeps only the IDs that are neither cached nor already returned by a productFetcher. */
  const getUncachedIds = (ids, cache, inFlight) => [
    ...new Set(
      (Array.isArray(ids) ? ids : [ids])
        .map((id) => String(id))
        .filter(
          (id) =>
            !cache[id] &&
            !inFlight?.some((item) => String(item.legacyResourceId) === id),
        ),
    ),
  ];

  /** POSTs the `product-details` intent for the product popover; skips cached IDs. */
  const handleProductPopoverShow = (productIds = []) => {
    console.log(productDetailsById);

    const uncachedIds = getUncachedIds(
      productIds,
      productDetailsById,
      productFetcher.data?.products,
    );

    if (uncachedIds.length === 0) return;

    productFetcher.submit(
      {
        intent: PRODUCT_DETAILS_INTENT,
        productIds: JSON.stringify(uncachedIds),
      },
      { method: "post" },
    );
  };

  /** POSTs the `variant-details` intent for the variant popover; skips cached IDs. */
  const handleVariantPopoverShow = (variantIds = []) => {
    console.log(variantDetailsById);

    const uncachedIds = getUncachedIds(
      variantIds,
      variantDetailsById,
      variantFetcher.data?.variants,
    );

    if (uncachedIds.length === 0) return;

    variantFetcher.submit(
      {
        intent: VARIANT_DETAILS_INTENT,
        variantIds: JSON.stringify(uncachedIds),
      },
      { method: "post" },
    );
  };

  return (
    <s-page
      heading="All Issues"
      inlineSize="large"
      className="app-catalog-health"
      breadcrumbs={[{ content: "Product", url: "/app/products" }]}
    >
      <s-query-container containerName="issue-details">
        <s-section padding="none">
          {/* Table stays mounted while the debounced loader re-runs. */}
          <s-table
            loading={isLoading}
            variant="@container issue-details (inline-size <= 600px) list, table"
          >
            <s-grid
              slot="filters"
              gap="small-200"
              gridTemplateColumns="auto auto 1fr"
            >
              {/* Product status filter menu. */}
              <ButtonFilter data={PRODUCT_STATUS_FILTERS} selected={productStatus} title="Status" params="status" />
              {/* Priority filter menu. */}
              <ButtonFilter data={PRIORITY_FILTERS} selected={priority} title="Priority" params="priority" />
              {/* Live search on typing, immediate on Enter. */}
              <s-search-field
                label="Search Issue"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search Issue"
                onInput={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              ></s-search-field>
            </s-grid>
            {/* Issue, affected products, affected variants, priority. */}
            <s-table-header-row>
              <s-table-header listSlot="primary">
                <s-stack paddingBlock="small-300">
                  <s-text>Issue</s-text>
                </s-stack>
              </s-table-header>
              <s-table-header listSlot="secondary">Products</s-table-header>
              <s-table-header listSlot="secondary">Variants</s-table-header>
              <s-table-header listSlot="kicker">Priority</s-table-header>
              <s-table-header listSlot="labeled">Category</s-table-header>
              <s-table-header listSlot="inline">Action</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <s-table-row key={issue.id}>
                    {/* Rule description shown by the tooltip on hover/focus. */}
                    <s-table-cell>
                      <s-tooltip id={`description-${issue.id}`}>
                        {issue.description}
                      </s-tooltip>
                      <s-stack
                        direction="inline"
                        alignItems="center"
                        gap="small"
                      >
                        <s-box
                          padding="small-500"
                          background="transparent"
                          border="base"
                          borderColor="strong"
                          borderRadius="base"
                        >
                          <s-icon
                            type="alert-circle"
                            tone={issue.tone}
                            interestFor={`description-${issue.id}`}
                          />
                        </s-box>
                        <s-text interestFor={`description-${issue.id}`}>
                          {issue.name}
                        </s-text>
                      </s-stack>
                    </s-table-cell>
                    {/* Affected products: opens the products drawer for this issue. */}
                    <s-table-cell>
                      <s-clickable-chip
                        color="subdued"
                        accessibilityLabel={`${issue.productsCount} Affected Product`}
                        commandFor={"affected-products-" + issue.id}
                      >
                        <s-icon
                          size="small"
                          slot="graphic"
                          type="product"
                        ></s-icon>
                        {issue.productsCount} Affected Product
                        {issue.productsCount > 1 ? "s" : ""}
                      </s-clickable-chip>
                      {/* Product details come from `action` on show, then stay cached. */}
                      <s-popover
                        id={"affected-products-" + issue.id}
                        onShow={() =>
                          handleProductPopoverShow(issue.productIds.slice(0, 3))
                        }
                      >
                        <s-box padding="base">
                          <s-stack gap="small">
                            <s-stack gap="small-200">
                              {(issue.productIds || [])
                                .slice(0, 3)
                                .map((productId) => {
                                  const _isPending =
                                    productFetcher.state !== "idle";
                                  const product =
                                    productDetailsById[String(productId)];

                                  return (
                                    <s-clickable
                                      key={"affected-products" + productId}
                                      paddingBlock="small-500"
                                      paddingInlineEnd="small"
                                      background={
                                        !product ? "subdued" : "transparent"
                                      }
                                      borderRadius="base"
                                      accessibilityVisibility="hidden"
                                      minInlineSize="224px"
                                      minBlockSize="18px"
                                      disabled={!product}
                                    >
                                      {!product ? null : (
                                        <>
                                          <s-stack
                                            direction="inline"
                                            alignItems="center"
                                            gap="small-200"
                                          >
                                            <s-thumbnail
                                              src={
                                                product?.featuredMedia?.preview
                                                  ?.image?.url || undefined
                                              }
                                              alt={
                                                product?.featuredMedia?.preview
                                                  ?.image?.altText ||
                                                "Product image"
                                              }
                                              size="small"
                                            />
                                            <s-box inlineSize="300px">
                                              <s-paragraph lineClamp={2}>
                                                {product?.title}
                                              </s-paragraph>
                                            </s-box>
                                            <s-badge
                                              tone={
                                                product?.status === "ACTIVE"
                                                  ? "success"
                                                  : "neutral"
                                              }
                                            >
                                              {toTitleCase(product?.status)}
                                            </s-badge>
                                          </s-stack>
                                        </>
                                      )}
                                    </s-clickable>
                                  );
                                })}
                            </s-stack>
                            <s-divider />
                            <s-button variant="secondary">
                              View issue details
                            </s-button>
                          </s-stack>
                        </s-box>
                      </s-popover>
                    </s-table-cell>
                    {/* Dash when the rule only targets products. */}
                    <s-table-cell>
                      {issue.variantsCount > 0 ? (
                        <s-clickable-chip
                          color="subdued"
                          accessibilityLabel={`${issue.variantsCount} Affected Product`}
                          commandFor={"variants-" + issue.id}
                        >
                          <s-icon
                            size="small"
                            slot="graphic"
                            type="variant"
                          ></s-icon>
                          {issue.variantsCount} Affected Variant
                          {issue.variantsCount > 1 ? "s" : ""}
                        </s-clickable-chip>
                      ) : (
                        <s-text>-</s-text>
                      )}
                      {/* Variant details come from `action` on show, then stay cached. */}
                      <s-popover
                        id={"variants-" + issue.id}
                        onShow={() =>
                          handleVariantPopoverShow(issue.variantIds.slice(0, 3))
                        }
                      >
                        <s-box padding="base">
                          <s-stack gap="small">
                            <s-stack gap="small-200">
                              {(issue.variantIds || [])
                                .slice(0, 3)
                                .map((variantId) => {
                                  const variant =
                                    variantDetailsById[String(variantId)];

                                  return (
                                    <s-clickable
                                      key={"affected-variants" + variantId}
                                      paddingBlock="small-500"
                                      paddingInlineEnd="small"
                                      background={
                                        !variant ? "subdued" : "transparent"
                                      }
                                      borderRadius="base"
                                      accessibilityVisibility="hidden"
                                      minInlineSize="224px"
                                      minBlockSize="18px"
                                      disabled={!variant}
                                    >
                                      {!variant ? null : (
                                        <>
                                          <s-stack
                                            direction="inline"
                                            alignItems="center"
                                            gap="small-200"
                                          >
                                            <s-thumbnail
                                              src={
                                                variant?.media?.nodes[0]
                                                  ?.preview?.image?.url ||
                                                undefined
                                              }
                                              alt={
                                                variant?.media?.nodes[0]
                                                  ?.preview?.image?.altText ||
                                                "Variant image"
                                              }
                                              size="small"
                                            />
                                            <s-box inlineSize="300px">
                                              <s-paragraph lineClamp={2}>
                                                {variant?.title} —{" "}
                                                {variant?.product?.title}
                                              </s-paragraph>
                                            </s-box>
                                          </s-stack>
                                        </>
                                      )}
                                    </s-clickable>
                                  );
                                })}
                            </s-stack>
                            <s-divider />
                            <s-button variant="secondary">
                              View issue details
                            </s-button>
                          </s-stack>
                        </s-box>
                      </s-popover>
                    </s-table-cell>
                    {/* Severity badge. */}
                    <s-table-cell>
                      <s-badge tone={issue.tone}>
                        {toTitleCase(issue.priority)}
                      </s-badge>
                    </s-table-cell>
                    {/* Category issue */}
                    <s-table-cell>
                      <s-chip
                        color="subdued"
                        accessibilityLabel="Product category"
                      >
                        <s-icon
                          slot="graphic"
                          type={issue.categoryIcon}
                          size="small"
                        ></s-icon>
                        {toTitleCase(issue.category)}
                      </s-chip>
                    </s-table-cell>
                    {/* Actions */}
                    <s-table-cell>
                      <s-button
                        icon="view"
                        variant="tertiary"
                        accessibilityLabel="Preview product"
                      ></s-button>
                    </s-table-cell>
                  </s-table-row>
                ))
              ) : (
                /* Shown when no issue matches the active filters. */
                <s-table-row>
                  <s-table-cell>{`No affected issue found.`}</s-table-cell>
                </s-table-row>
              )}
            </s-table-body>
          </s-table>
        </s-section>
      </s-query-container>
      <s-section heading="issue">
        <s-paragraph>
          <pre>{JSON.stringify(issues, null, 2)}</pre>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
