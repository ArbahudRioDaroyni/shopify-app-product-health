import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getProducts } from "../services/shopify/products.server";
import { scanProducts } from "../services/scanner/product-scanner.server";
import { getOrCreateShop, shouldRunInitialScan } from "../services/models/shop.server";
import { fetchMonthlyDashboardSnapshot } from "../services/models/dashboard.server";
import { getIssueTrends } from "../services/models/issue.server";
import { saveBulkCatalogScan } from "../services/core/store.server";

import HealthScore from "../components/dashboard/health-score";
import TotalProducts from "../components/dashboard/total-products";
import LastScan from "../components/dashboard/last-scan";
import TopIssues from "../components/dashboard/top-issues";
import HealthScoreOverTime from "../components/dashboard/health-score-over-time";
// import HealthByCollection from "../components/dashboard/health-by-collection";
import styles from "../styles.css?url";

export const links = () => [{ rel: "stylesheet", href: styles }];

export const loader = async ({ request }) => {
  const { admin, _session } = await authenticate.admin(request);
  const shop = await getOrCreateShop({ admin });
  const isNeedsScan = await shouldRunInitialScan(shop);

  if (!isNeedsScan) {
    const products = await getProducts(admin);
    const scanResults = scanProducts(products);
    const flattenScanResults = scanResults.flatMap((result) => result.results);

    await saveBulkCatalogScan({
      shopId: shop.id,
      scanResults: flattenScanResults,
      scanType: "full",
    });
  }

  const monthlyDashboardData = await fetchMonthlyDashboardSnapshot({shopId: shop.id});
  const issueTrends = await getIssueTrends();

  return {
    monthlyDashboardData,
    isUpdating: shop.scanStatus === "IN_PROGRESS",
    issueTrends
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  console.log(admin, session);
  
  const shop = await getOrCreateShop({domain: session.shop});

  const products = await getProducts(admin);
  const scanResults = scanProducts(products);
  const flattenScanResults = scanResults.flatMap((result) => result.results);

  await saveBulkCatalogScan({
    shopId: shop.id,
    scanResults: flattenScanResults,
    scanType: "manual",
  });

  return { started: true };
};

export default function Dashboard() {
  const {
    monthlyDashboardData,
    isUpdating,
    issueTrends
  } = useLoaderData();

  return (
    <s-page heading="Dashboard" inlineSize="large" className="app-catalog-health">
      <s-button slot="secondary-actions" icon="calendar" accessibilityLabel="Pick a date range">May 12 - Jun 11, 2026</s-button>
      <s-button slot="secondary-actions" icon="download" accessibilityLabel="Export dashboard report">Export</s-button>

      {isUpdating && (
        <s-banner tone="info">Catalog scan is updating in the background.</s-banner>
      )}

      <s-section padding="base" className="dashboard-summary">
        <s-query-container containerName="dashboard-summary">
          <s-grid
            gridTemplateColumns="@container dashboard-summary (inline-size <= 600px) 1fr, 1fr auto 1fr auto 1fr"
            gap="small"
          >
            <HealthScore data={monthlyDashboardData.at(-1)} />
            <s-divider direction="@container (inline-size <= 600px) inline, block" />
            <TotalProducts
              total={monthlyDashboardData.at(-1).totalProducts}
              healthy={monthlyDashboardData.at(-1).healthyProducts}
              warning={monthlyDashboardData.at(-1).needsAttentionProducts}
              critical={monthlyDashboardData.at(-1).criticalProducts}
            />
            <s-divider direction="@container (inline-size <= 600px) inline, block" />
            <LastScan
              lastScanAt={monthlyDashboardData.at(-1)?.createdAt?.toISOString() || null}
              isUpdating={isUpdating}
            />
          </s-grid>
        </s-query-container>
      </s-section>

      <s-grid
        gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr 1fr 1fr"
        gap="base"
        paddingBlockEnd="base"
      >
        <TopIssues data={issueTrends} />
        <HealthScoreOverTime history={monthlyDashboardData} />
        {/* <HealthByCollection collections={collectionHealth} /> */}
      </s-grid>

      {/* <s-section heading="issueTrends Section">
        <s-paragraph>
          <pre>{JSON.stringify(issueTrends, null, 2)}</pre>
        </s-paragraph>
      </s-section> */}
    </s-page>
  );
}
