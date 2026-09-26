import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getProducts } from "../services/shopify/products.server";
import { scanProducts } from "../services/scanner/product-scanner.server";
import { getOrCreateShop } from "../services/models/shop.server";
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
  const { admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop({ admin });
  // const isNeedsScan = await shouldRunInitialScan(shop);

  // if (!isNeedsScan) {
  //   const products = await getProducts(admin);
  //   const scanResults = scanProducts(products);
  //   const flattenScanResults = scanResults.flatMap((result) => result.results);

  //   await saveBulkCatalogScan({
  //     shopId: shop.id,
  //     scanResults: flattenScanResults,
  //     scanType: "full",
  //   });
  // }

  const monthlyDashboardData = (await fetchMonthlyDashboardSnapshot({ shopId: shop.id })) || [];
  const issueTrends = (await getIssueTrends()) || [];

  return {
    monthlyDashboardData,
    isUpdating: shop.scanStatus === "PROCESSING",
    issueTrends
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  console.log(admin, session);
  
  const shop = await getOrCreateShop({ admin });

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
    monthlyDashboardData = [],
    isUpdating,
    issueTrends = []
  } = useLoaderData();

  const latestDashboardSnapshot = monthlyDashboardData.length > 0 ? monthlyDashboardData.at(-1) : null;
  const hasNoData = !latestDashboardSnapshot;

  return (
    <s-page heading="Dashboard" inlineSize="large" className="app-catalog-health">
      <s-button slot="secondary-actions" icon="calendar" accessibilityLabel="Pick a date range">May 12 - Jun 11, 2026</s-button>
      <s-button slot="secondary-actions" icon="download" accessibilityLabel="Export dashboard report">Export</s-button>

      {isUpdating && (
        <s-banner tone="info">Catalog scan is updating in the background.</s-banner>
      )}

      {hasNoData && !isUpdating && (
        <s-banner tone="warning" heading="No data available">
          We haven`t found any catalog scan data yet. Please trigger a manual scan or wait for the initial setup to complete.
        </s-banner>
      )}

      <s-section padding="base" className="dashboard-summary">
        <s-query-container containerName="dashboard-summary">
          <s-grid
            gridTemplateColumns="@container dashboard-summary (inline-size <= 600px) 1fr, 1fr auto 1fr auto 1fr"
            gap="small"
          >
            <HealthScore data={latestDashboardSnapshot} />
            
            <s-divider direction="@container (inline-size <= 600px) inline, block" />
            
            <TotalProducts
              total={latestDashboardSnapshot?.totalProducts ?? 0}
              healthy={latestDashboardSnapshot?.healthyProducts ?? 0}
              warning={latestDashboardSnapshot?.needsAttentionProducts ?? 0}
              critical={latestDashboardSnapshot?.criticalProducts ?? 0}
            />
            
            <s-divider direction="@container (inline-size <= 600px) inline, block" />
            
            <LastScan
              lastScanAt={latestDashboardSnapshot?.createdAt ? new Date(latestDashboardSnapshot.createdAt).toISOString() : null}
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

      <s-section heading="latestDashboardSnapshot Section">
        <s-paragraph>
          <pre>{JSON.stringify(latestDashboardSnapshot, null, 2)}</pre>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
