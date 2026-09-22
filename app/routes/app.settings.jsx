// import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import styles from "../styles.css?url";

export const links = () => [{ rel: "stylesheet", href: styles }];

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  return {
    admin,
		session
  };
};

export default function ProductCompletenessPage() {
  // const { admin, session } = useLoaderData();

  return (
    <form
      data-save-bar
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formEntries = Object.fromEntries(formData);
        console.log("Form data", formEntries);
      }}
      onReset={() => {
        console.log("Handle discarded changes if necessary");
      }}
    >
      <s-page heading="Settings" inlineSize="base" className="app-catalog-health">
				<s-grid
					gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr 1fr"
					gap="base"
					paddingBlockEnd="base"
				>
					<s-section>
						<s-grid gridTemplateColumns="auto 1fr" gap="small" alignItems="center" paddingBlockEnd="base">
							<s-icon type="calendar-time"></s-icon>
							<s-heading>Scan Schedule</s-heading>
						</s-grid>
						<s-stack gap="small-500">
							<s-choice-list label="Set how often catalog health scan runs automatically" name="currency">
								<s-choice value="1" selected>
									Daily
									<s-text slot="details">Scan every day at 02:00 AM</s-text>
								</s-choice>
								<s-choice value="7">
									Weekly
									<s-text slot="details">Scan every Sunday at 02:00 AM</s-text>
								</s-choice>
								<s-choice value="">
									Custom
								</s-choice>
							</s-choice-list>
							<s-date-field
								label="Set your own schedule"
								name="appointmentDate"
								allow="start--end"
								type="range"
								details="Select from available time slots"
							></s-date-field>
						</s-stack>
					</s-section>

					<s-section>
						<s-grid gridTemplateColumns="auto 1fr" gap="small" alignItems="center" paddingBlockEnd="base">
							<s-icon type="star"></s-icon>
							<s-heading>Health Score Penalties</s-heading>
						</s-grid>
						<s-stack gap="base">
							<s-text tone="subdued">
								Adjust the penalty deduction points applied to the health score calculation based on issue severity.
							</s-text>
							<s-divider />

							<s-grid gridTemplateColumns="1fr 1fr 1fr" gap="small-300">
								<s-text-field
									label="High Penalty"
									type="number"
								/>
								<s-text-field
									label="Medium Penalty"
									type="number"
								/>
								<s-text-field
									label="Low Penalty"
									type="number"
								/>
							</s-grid>

							<s-heading level="3">Maximum Penalty Caps</s-heading>
							<s-grid gridTemplateColumns="1fr 1fr 1fr" gap="small-300">
								<s-text-field
									label="Max High Cap"
									type="number"
								/>
								<s-text-field
									label="Max Medium Cap"
									type="number"
								/>
								<s-text-field
									label="Max Low Cap"
									type="number"
								/>
							</s-grid>
						</s-stack>
					</s-section>
				</s-grid>


        {/* === */}
        {/* Notifications */}
        {/* === */}
        <s-section heading="Notifications">
          <s-select
            label="Notification frequency"
            name="notification-frequency"
          >
            <s-option value="immediately" selected>
              Immediately
            </s-option>
            <s-option value="hourly">Hourly digest</s-option>
            <s-option value="daily">Daily digest</s-option>
          </s-select>
          <s-choice-list
            label="Notification types"
            name="notifications-type"
            multiple
          >
            <s-choice value="new-order" selected>
              New order notifications
            </s-choice>
            <s-choice value="low-stock">Low stock alerts</s-choice>
            <s-choice value="customer-review">
              Customer review notifications
            </s-choice>
            <s-choice value="shipping-updates">Shipping updates</s-choice>
          </s-choice-list>
        </s-section>

        {/* === */}
        {/* Connected accounts */}
        {/* === */}
        <s-section heading="Connected accounts">
          <s-stack gap="base">
            <s-grid
              gridTemplateColumns="1fr auto"
              gap="base"
              alignItems="center"
            >
              <s-grid-item>
                <s-stack>
                  <s-heading>Puzzlify</s-heading>
                  <s-text color="subdued">No account connected</s-text>
                </s-stack>
              </s-grid-item>
              <s-grid-item>
                <s-button variant="primary">Connect</s-button>
              </s-grid-item>
            </s-grid>
            <s-text>
              By clicking Connect, you agree to accept Sample App s terms and
              conditions. You ll pay a commission rate of 15% on sales made
              through Sample App.
            </s-text>
          </s-stack>
        </s-section>

        {/* === */}
        {/* Preferences */}
        {/* === */}
        <s-section heading="Preferences">
          <s-box border="base" borderRadius="base">
            <s-clickable
              padding="small-100"
              href="/app/settings/shipping"
              accessibilityLabel="Configure shipping methods, rates, and fulfillment options"
            >
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Shipping & fulfillment</s-heading>
                  <s-paragraph color="subdued">
                    Shipping methods, rates, zones, and fulfillment preferences.
                  </s-paragraph>
                </s-box>
                <s-icon type="chevron-right" />
              </s-grid>
            </s-clickable>
            <s-box paddingInline="small-100">
              <s-divider />
            </s-box>

            <s-clickable
              padding="small-100"
              href="/app/settings/products_catalog"
              accessibilityLabel="Configure product defaults, customer experience, and catalog settings"
            >
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Products & catalog</s-heading>
                  <s-paragraph color="subdued">
                    Product defaults, customer experience, and catalog display
                    options.
                  </s-paragraph>
                </s-box>
                <s-icon type="chevron-right" />
              </s-grid>
            </s-clickable>
            <s-box paddingInline="small-100">
              <s-divider />
            </s-box>

            <s-clickable
              padding="small-100"
              href="/app/settings/customer_support"
              accessibilityLabel="Manage customer support settings and help resources"
            >
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Customer support</s-heading>
                  <s-paragraph color="subdued">
                    Support settings, help resources, and customer service
                    tools.
                  </s-paragraph>
                </s-box>
                <s-icon type="chevron-right" />
              </s-grid>
            </s-clickable>
          </s-box>
        </s-section>

        {/* === */}
        {/* Tools */}
        {/* === */}
        <s-section heading="Tools">
          <s-stack
            gap="none"
            border="base"
            borderRadius="base"
            overflow="hidden"
          >
            <s-box padding="small-100">
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Reset app settings</s-heading>
                  <s-paragraph color="subdued">
                    Reset all settings to their default values. This action
                    cannot be undone.
                  </s-paragraph>
                </s-box>
                <s-button tone="critical">Reset</s-button>
              </s-grid>
            </s-box>
            <s-box paddingInline="small-100">
              <s-divider />
            </s-box>

            <s-box padding="small-100">
              <s-grid
                gridTemplateColumns="1fr auto"
                alignItems="center"
                gap="base"
              >
                <s-box>
                  <s-heading>Export settings</s-heading>
                  <s-paragraph color="subdued">
                    Download a backup of all your current settings.
                  </s-paragraph>
                </s-box>
                <s-button>Export</s-button>
              </s-grid>
            </s-box>
          </s-stack>
        </s-section>

        {/* Footer help */}
        <s-stack alignItems="center" paddingBlock="large">
          <s-text color="subdued">
            Learn more about{" "}
            <s-link href="https://help.shopify.com" target="_blank">
              quality scoring best practices
            </s-link>
            .
          </s-text>
        </s-stack>

					{/* <s-section>
						<s-paragraph>
							<pre>{JSON.stringify(admin, null, 2)}</pre>
							<pre>{JSON.stringify(session, null, 2)}</pre>
						</s-paragraph>
					</s-section> */}
      </s-page>
    </form>
  );
}
