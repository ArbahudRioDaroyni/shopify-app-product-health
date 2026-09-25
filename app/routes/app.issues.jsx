import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData, useNavigation, useSearchParams } from "react-router";
import { authenticate } from "../shopify.server";
import { getIssues } from "../services/models/issue.server";
import { getOrCreateShop } from "../services/models/shop.server";
import { customDebounce, toTitleCase } from "../utils/formatters";
import styles from "../styles.css?url";

export const links = () => [{ rel: "stylesheet", href: styles }];

const PRODUCT_STATUS_FILTERS_NEW = ["all", "active", "draft", "archived"];
const PRIORITY_FILTERS = ["all", "improvement", "needs_attention", "critical"];

// Jeda (ms) sebelum perubahan filter ditulis ke query string & memicu loader.
const FILTER_DEBOUNCE_DELAY = 300;

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const priority = url.searchParams.get("priority") || "all";

  const getProductStatus = () => {
    const rawProductStatus = url.searchParams.get("status") || "all";
    const isValidStatus = PRODUCT_STATUS_FILTERS_NEW.some(
      (filter) => filter === rawProductStatus.toLowerCase(),
    );
    const productStatus = isValidStatus ? rawProductStatus : "all";
    return productStatus;
  };
  const productStatus = getProductStatus();

  const shop = await getOrCreateShop({ admin });
  const issues = await getIssues({
    shopId: shop.id,
    search,
    priority,
    productStatus: productStatus.toUpperCase(),
  });

  return { issues, priority, productStatus };
}

export default function Issues() {
  const { issues, priority, productStatus } = useLoaderData();
  const [_filterParams, setFilterParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const [activeStatusFilter, setActiveStatusFilter] = useState(
    String(productStatus),
  );
  const [activePriorityFilter, setActivePriorityFilter] = useState(
    String(priority),
  );
  const [searchInput, setSearchInput] = useState("");

  // useSearchParams mengembalikan setter baru setiap kali query string berubah,
  // jadi setter disimpan di ref agar debounce selalu memakai versi terbaru.
  const setFilterParamsRef = useRef(setFilterParams);
  useEffect(() => {
    setFilterParamsRef.current = setFilterParams;
  }, [setFilterParams]);

  // Penampung perubahan filter yang belum ditulis ke URL.
  const pendingParamsRef = useRef({});

  // Satu debounce untuk semua filter: klik cepat berturut-turut digabung menjadi
  // satu navigasi saja (loader jalan sekali, value terakhir yang menang).
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

  // Batalkan timer yang masih pending ketika komponen di-unmount.
  useEffect(() => () => debouncedApplyParams.cancel(), [debouncedApplyParams]);

  // Tulis perubahan query param setelah user berhenti berinteraksi.
  const queueParamUpdate = (key, value) => {
    pendingParamsRef.current = { ...pendingParamsRef.current, [key]: value };
    debouncedApplyParams();
  };

  const handleSearchInput = (value) => {
    setSearchInput(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setFilterParams(
        (params) => {
          params.set("search", String(searchInput));
          return params;
        },
        { preventScrollReset: true },
      );
    }
  };

  // State lokal di-update langsung supaya label & ikon "check" tetap responsif,
  // sedangkan query string-nya ditulis lewat debounce.
  const handlePriorityFilter = (value) => {
    setActivePriorityFilter(value);
    queueParamUpdate("priority", value);
  };

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
          <s-table
            loading={isLoading}
            variant="@container issue-details (inline-size <= 600px) list, table"
          >
            <s-grid
              slot="filters"
              gap="small-200"
              gridTemplateColumns="auto auto 1fr"
            >
              {/* Product Status Filter */}
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
              {/* Priority Filter */}
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
              {/* Search Issue Filter */}
              {/* Search menerapkan filter saat Enter ditekan. Untuk live-search,
                  tambahkan queueParamUpdate("search", e.target.value) di onInput. */}
              <s-search-field
                label="Search Issue"
                labelAccessibilityVisibility="exclusive"
                placeholder="Search Issue"
                onInput={(e) => handleSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              ></s-search-field>
            </s-grid>
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
                    <s-table-cell>
                      <s-badge tone={issue.tone}>
                        {toTitleCase(issue.priority)}
                      </s-badge>
                    </s-table-cell>
                  </s-table-row>
                ))
              ) : (
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
