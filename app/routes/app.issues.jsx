/**
 * All Issues route (`/app/issues`).
 *
 * Renders the catalog issue table together with three filters: product status,
 * priority, and a search field. Every filter lives in the URL query string
 * (`status`, `priority`, `search`) so the loader can re-query the database and
 * the page stays bookmarkable and shareable.
 *
 * Query string writes are debounced (see `queueParamUpdate`) so several fast
 * filter clicks collapse into a single navigation, and therefore a single
 * loader run.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigation, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import { getIssues } from "../services/models/issue.server";
import { getOrCreateShop } from "../services/models/shop.server";
import { customDebounce, toTitleCase } from "../utils/formatters";
import styles from "../styles.css?url";

/**
 * Style sheet link descriptor consumed by React Router.
 *
 * @returns {{ rel: string, href: string }[]} Links injected into the document head.
 */
export const links = () => [{ rel: "stylesheet", href: styles }];

/**
 * Selectable product status values.
 *
 * `loader` validates the `status` query param against this list before the value
 * is upper-cased and used in the Prisma query.
 */
const PRODUCT_STATUS_FILTERS_NEW = ["all", "active", "draft", "archived"];

/**
 * Selectable issue priority values.
 *
 * `getIssues` maps these UI strings to the Prisma priority enum.
 */
const PRIORITY_FILTERS = ["all", "improvement", "needs_attention", "critical"];

/**
 * Delay in milliseconds before buffered filter changes are written to the query
 * string and the loader is re-triggered.
 *
 * Lower it for snappier filter feedback, raise it to reduce loader/database calls.
 */
const FILTER_DEBOUNCE_DELAY = 500;

/**
 * Loader for the All Issues page.
 *
 * Reads the `search`, `priority`, and `status` filters from the request URL,
 * resolves the current shop, and returns every issue matching those filters. An
 * unknown `status` value falls back to `all` before it is upper-cased for the
 * database query.
 *
 * @param {{ request: Request }} args React Router loader arguments.
 * @returns {Promise<{
 *   issues: object[],
 *   search: string,
 *   priority: string,
 *   productStatus: string,
 * }>} The matching issues plus the active filter values, so the component can
 *   render its filter controls with the correct label, check icon, and text.
 */
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  /** Parsed request URL, used to read the filter query params. */
  const url = new URL(request.url);
  /** Free-text search term typed by the user; empty string means no search. */
  const search = url.searchParams.get("search") || "";
  /** Selected issue priority; defaults to `all` when the param is missing. */
  const priority = url.searchParams.get("priority") || "all";

  /**
   * Reads and validates the `status` query param.
   *
   * @returns {string} The requested product status when it is a known filter,
   *   otherwise `all`.
   */
  const getProductStatus = () => {
    const rawProductStatus = url.searchParams.get("status") || "all";
    const isValidStatus = PRODUCT_STATUS_FILTERS_NEW.some(
      (filter) => filter === rawProductStatus.toLowerCase(),
    );
    const productStatus = isValidStatus ? rawProductStatus : "all";
    return productStatus;
  };
  /** Validated product status filter used by the query. */
  const productStatus = getProductStatus();

  /** Shop record the issues belong to. */
  const shop = await getOrCreateShop({ admin });
  /** Issues matching the current search, priority, and product status filters. */
  const issues = await getIssues({
    shopId: shop.id,
    search,
    priority,
    productStatus: productStatus.toUpperCase(),
  });

  return { issues, search, priority, productStatus };
}

/**
 * All Issues page component.
 *
 * Filter changes are applied in two steps: local state is updated right away so
 * the filter button label, check icon, and search text react instantly, while the
 * query string (and with it the loader) is written by a debounced writer so that
 * rapid clicks or keystrokes only trigger one navigation.
 *
 * @returns {JSX.Element} The issue table page with its filter controls.
 */
export default function Issues() {
  /** Data returned by `loader`: the issues plus the active filters. */
  const { issues, search, priority, productStatus } = useLoaderData();
  /** Query string accessor pair; only the setter is used, through a ref. */
  const [_filterParams, setFilterParams] = useSearchParams();
  const navigation = useNavigation();
  /** True while the loader for the latest filter change is still running. */
  const isLoading = navigation.state === "loading";
  /** Product status shown as selected; seeded from the loader data. */
  const [activeStatusFilter, setActiveStatusFilter] = useState(String(productStatus));
  /** Priority shown as selected; seeded from the loader data. */
  const [activePriorityFilter, setActivePriorityFilter] = useState(String(priority));
  /** Search text displayed in the field; seeded from the loader data. */
  const [activeSearchFilter, setSearchFilter] = useState(String(search));

  /**
   * Ref holding the most recent query string setter.
   *
   * `useSearchParams` returns a new setter every time the query string changes, so
   * caching one inside `useMemo` would recreate the debouncer (orphaning its
   * pending timer) and could replay a stale params snapshot. Reading the setter
   * through a ref keeps the debouncer stable and always up to date.
   */
  const setFilterParamsRef = useRef(setFilterParams);
  useEffect(() => {
    setFilterParamsRef.current = setFilterParams;
  }, [setFilterParams]);

  /**
   * Buffer of pending query string updates, keyed by param name.
   *
   * Keys are merged before flushing, so the last value of each param wins and
   * updates to different params do not cancel each other.
   */
  const pendingParamsRef = useRef({});

  /**
   * Debounced query string writer shared by all filters.
   *
   * Flushes every buffered update in a single navigation (one loader run) while
   * preserving the params that are not part of the update. The empty dependency
   * list creates it once per component instance; a pending flush can be aborted
   * with `debouncedApplyParams.cancel()`.
   */
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
      }, FILTER_DEBOUNCE_DELAY),
    [],
  );

  /** Cancels a pending flush when the component unmounts. */
  useEffect(() => () => debouncedApplyParams.cancel(), [debouncedApplyParams]);

  /**
   * Buffers a query string change and schedules a debounced flush.
   *
   * @param {string} key Query param name, e.g. `"priority"`.
   * @param {string} value New value for that param.
   */
  const queueParamUpdate = (key, value) => {
    pendingParamsRef.current = { ...pendingParamsRef.current, [key]: value };
    debouncedApplyParams();
  };

  /**
   * Applies the search term immediately when Enter is pressed, bypassing the
   * debounce so the user gets an instant result for an explicit submit.
   *
   * @param {{ key: string }} e Keydown event from the search field.
   */
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

  /**
   * Live search: mirrors the typed text into local state and debounces the
   * `search` query param, so the loader only re-runs once the user pauses typing.
   *
   * @param {string} value Text currently in the search field.
   */
  const handleSearchInput = (value) => {
    setSearchFilter(value);
    queueParamUpdate("search", value);
  };

  /**
   * Selects a priority filter.
   *
   * The selection is reflected in local state immediately for instant feedback,
   * while the `priority` query param is written by the debounced writer.
   *
   * @param {string} value One of `PRIORITY_FILTERS`.
   */
  const handlePriorityFilter = (value) => {
    setActivePriorityFilter(value);
    queueParamUpdate("priority", value);
  };

  /**
   * Selects a product status filter.
   *
   * The selection is reflected in local state immediately for instant feedback,
   * while the `status` query param is written by the debounced writer.
   *
   * @param {string} value One of `PRODUCT_STATUS_FILTERS_NEW`.
   */
  const handleProductStatusFilter = (value) => {
    setActiveStatusFilter(value);
    queueParamUpdate("status", value);
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
          {/* Issues table: `loading` is driven by the router navigation state, so
              the table stays mounted while the debounced loader re-runs. */}
          <s-table
            loading={isLoading}
            variant="@container issue-details (inline-size <= 600px) list, table"
          >
            <s-grid
              slot="filters"
              gap="small-200"
              gridTemplateColumns="auto auto 1fr"
            >
              {/* Product Status Filter: menu button showing the active status plus
                  a menu of the selectable statuses. */}
              <s-button commandFor="product-status-menu" disabled={isLoading}>
                {`Status: ${toTitleCase(PRODUCT_STATUS_FILTERS_NEW.find((f) => f === activeStatusFilter))}`}
              </s-button>
              <s-menu
                id="product-status-menu"
                accessibilityLabel="Filter Product Status Menu Actions"
              >
                {PRODUCT_STATUS_FILTERS_NEW.map((filter) => (
                  <s-button
                    key={filter}
                    icon={activeStatusFilter === filter ? "check" : undefined}
                    onClick={() => handleProductStatusFilter(filter)}
                    accessibilityLabel="Select product status issue for filter"
                  >
                    {toTitleCase(filter)}
                  </s-button>
                ))}
              </s-menu>
              {/* Priority Filter: menu button showing the active priority plus a
                  menu of the selectable priorities. */}
              <s-button
                commandFor="top-issues-priority-menu"
                variant="secondary"
              >
                {`Priority: ${toTitleCase(PRIORITY_FILTERS.find((f) => f === activePriorityFilter))}`}
              </s-button>
              <s-menu
                id="top-issues-priority-menu"
                accessibilityLabel="Issue priority filter"
              >
                {PRIORITY_FILTERS.map((filter) => (
                  <s-button
                    key={filter}
                    icon={activePriorityFilter === filter ? "check" : undefined}
                    onClick={() => handlePriorityFilter(filter)}
                    accessibilityLabel="Select priority issue for filter"
                  >
                    {toTitleCase(filter)}
                  </s-button>
                ))}
              </s-menu>
              {/* Search Issue Filter: typing triggers a debounced live search
                  through `handleSearchInput`, and Enter applies it immediately. */}
              <s-search-field
                label="Search Issue"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search Issue"
                onInput={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              ></s-search-field>
            </s-grid>
            {/* Column headers: issue, affected products, affected variants, priority. */}
            <s-table-header-row>
              <s-table-header listSlot="primary">Issue</s-table-header>
              <s-table-header listSlot="inline">Products</s-table-header>
              <s-table-header listSlot="inline">Variants</s-table-header>
              <s-table-header listSlot="labeled">Priority</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <s-table-row key={issue.id}>
                    {/* Issue name; the tooltip (opened on hover/focus of the
                        interested elements) shows the rule description. */}
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
                        commandFor={"products-" + issue.id}
                      >
                        <s-icon
                          size="small"
                          slot="graphic"
                          type="product"
                        ></s-icon>
                        {issue.productsCount} Affected Product
                      </s-clickable-chip>
                    </s-table-cell>
                    {/* Affected variants; a dash when the rule only targets products. */}
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
                          {issue.variantsCount} Affected Variants
                        </s-clickable-chip>
                      ) : (
                        <s-text>-</s-text>
                      )}
                    </s-table-cell>
                    {/* Severity badge, e.g. "Critical" or "Needs Attention". */}
                    <s-table-cell>
                      <s-badge tone={issue.tone}>
                        {toTitleCase(issue.priority)}
                      </s-badge>
                    </s-table-cell>
                  </s-table-row>
                ))
              ) : (
                /* Empty state: shown when no issue matches the active filters. */
                <s-table-row>
                  <s-table-cell>{`No affected issue found.`}</s-table-cell>
                </s-table-row>
              )}
            </s-table-body>
          </s-table>
        </s-section>
      </s-query-container>
      {/* <s-section heading="issue">
        <s-paragraph>
          <pre>{JSON.stringify(issues, null, 2)}</pre>
        </s-paragraph>
      </s-section> */}
    </s-page>
  );
}
