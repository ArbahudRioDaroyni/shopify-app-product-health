import { useFetcher, useRevalidator } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getOrCreateShop } from "../services/models/shop.server";
import { getInitials } from "../utils/formatters";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const shop = await getOrCreateShop({ admin });

  return { shop };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  console.log(admin, session);

  return { started: true };
};

export default function Index() {
  const { shop } = useLoaderData();

  const fetcher = useFetcher();
  const _revalidator = useRevalidator();

  return (
    <s-page heading="Catalog Health">
      <s-section heading="issueTrends Section">
        <s-paragraph>
          <pre>{JSON.stringify(shop, null, 2)}</pre>
        </s-paragraph>
      </s-section>
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

              <s-stack alignItems="end" paddingBlockStart="base">
                <s-button
                  loading={fetcher.state !== "idle"}
                  icon="search-resource"
                  variant="primary"
                  onClick={() => fetcher.submit({}, { method: "post" })}
                >
                  Start first scan
                </s-button>
              </s-stack>
            </s-box>
          </s-box>
        </s-grid>
      </s-section>
    </s-page>
  );
}
