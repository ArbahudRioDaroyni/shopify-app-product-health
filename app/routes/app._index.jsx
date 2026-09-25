import { useFetcher } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getProducts } from "../services/shopify/products.server";
import { scanProducts } from "../services/scanner/product-scanner.server";
import { saveBulkCatalogScan } from "../services/core/store.server";
import {
  getOrCreateShop,
  shouldRunInitialScan,
} from "../services/models/shop.server";
import { getInitials, formatDateTime } from "../utils/formatters";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop({ admin });
  const isNeedsScan = await shouldRunInitialScan(shop);

  return { shop, isNeedsScan };
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

export default function Index() {
  const { shop, isNeedsScan } = useLoaderData();
  const fetcher = useFetcher();

  return (
    <s-page heading="Catalog Health">
      {/* Setup Guide */}
      <s-section>
        <s-grid gap="small">
          {/* Header */}
          <s-grid gap="small-200">
            <s-heading>Setup Guide</s-heading>
            <s-heading fontSize="large-300">
              Welcome to Catalog Health
            </s-heading>
            <s-paragraph>
              Improve your catalog health and make your products more
              discoverable. <br></br>
              We will scan your products and variants to find and fix common
              catalog issues.
            </s-paragraph>
          </s-grid>
          {/* Steps Container */}
          <s-box borderRadius="base" border="base" background="base">
            {/* Step 1 */}
            <s-box padding="base">
              <s-stack gap="base">
                <s-text>1. Connect your store</s-text>
                <s-box padding="small" background="subdued" borderRadius="base">
                  <s-grid
                    gridTemplateColumns="1fr auto"
                    gap="base"
                    alignItems="center"
                  >
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <s-avatar
                        initials={getInitials(shop.details.name)}
                        alt="Your store"
                        size="base"
                      ></s-avatar>
                      <s-stack gap="small-400">
                        <s-heading>{shop.details.name}</s-heading>
                        <s-text color="subdued">
                          Shopify {shop.details.plan.publicDisplayName} merchant
                        </s-text>
                      </s-stack>
                    </s-stack>
                    <s-badge icon="check" tone="success">
                      Connected
                    </s-badge>
                  </s-grid>
                </s-box>
              </s-stack>
            </s-box>
          </s-box>
          <s-box borderRadius="base" border="base" background="base">
            {/* Step 2 */}
            <s-box padding="base">
              <s-stack gap="base">
                <s-text>2. Start your first scan</s-text>
                <s-box padding="small" background="subdued" borderRadius="base">
                  <s-grid
                    gridTemplateColumns="1fr auto"
                    gap="base"
                    alignItems="center"
                  >
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <s-heading>Scan history: </s-heading>
                      {isNeedsScan ? (
                        <s-badge icon="alert-circle" tone="warning">
                          No scan history
                        </s-badge>
                      ) : (
                        <s-text>{formatDateTime(shop.scanStartedAt)}</s-text>
                      )}
                    </s-stack>
                    {isNeedsScan ? (
                      <s-button
                        loading={fetcher.state !== "idle"}
                        icon="search-resource"
                        variant="primary"
                        onClick={() => fetcher.submit({}, { method: "post" })}
                      >
                        Start first scan
                      </s-button>
                    ) : (
                      <s-badge icon="check" tone="success">
                        Completed
                      </s-badge>
                    )}
                  </s-grid>
                </s-box>
              </s-stack>
            </s-box>
          </s-box>
        </s-grid>
      </s-section>

      {/* <s-section heading="fetcher.data Section">
        <s-paragraph>
          <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
        </s-paragraph>
      </s-section> */}

      {/* <s-section heading="issueTrends Section">
        <s-paragraph>
          <pre>{JSON.stringify(issueTrends, null, 2)}</pre>
        </s-paragraph>
      </s-section> */}
    </s-page>
  );
}
