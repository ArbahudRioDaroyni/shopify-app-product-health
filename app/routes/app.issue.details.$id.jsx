import { useState, useEffect } from "react";
import { useLoaderData, useSearchParams, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { getIssueDetailsById } from "../services/models/issue.server";
import { getVariantById } from "../services/shopify/products.server";
import { toTitleCase, formatDateTime } from "../utils/formatters";
import styles from "../styles.css?url";

export const links = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const id = params.id;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = 10;
  const issue = await getIssueDetailsById({ id, page, pageSize });
  const test = await getVariantById(admin, String(44211883900964));

  return { issue, page, pageSize, test };
}

export default function IssueDetail() {
  const { issue, page, pageSize } = useLoaderData();
  const [_searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const totalPages = Math.ceil(issue.count / pageSize);
  const [inputPage, setInputPage] = useState(String(page));

  useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  const goToPage = (newPage) => {
    const pageNum = parseInt(newPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages && pageNum !== page) {
      setSearchParams(
        (params) => {
          params.set("page", String(pageNum));
          return params;
        },
        { preventScrollReset: true }
      );
    } else {
      setInputPage(String(page));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      goToPage(inputPage);
    }
  };

  const handleBlur = () => {
    goToPage(inputPage);
  };

  return (
    <s-page heading={issue.name} inlineSize="large" className="app-catalog-health" breadcrumbs={[{ content: "Product", url: "/app/products" }]}>
      <s-link slot="breadcrumb-actions" href="/issues">Issue</s-link>
      <s-query-container containerName="issue-details">
        <s-grid
          gridTemplateColumns="@container issue-details (inline-size <= 600px) 1fr, auto 300px 300px"
          gap="base"
          paddingBlockEnd="base"
        >
          <s-section>
            <s-stack gap="small-200">
              <s-badge tone={issue.tone} icon="alert-circle">{toTitleCase(issue.priority)}</s-badge>
              <s-stack gap="small">
                <s-stack gap="small-500">
                  <p className="health-summary__main-text">{issue.name}</p>
                  <s-text color="subdued">{issue.summary}</s-text>
                </s-stack>
                <s-text>{issue.description}</s-text>
                <s-stack direction="inline" gap="base" alignItems="center">
                  <s-stack direction="inline" gap="small-300" alignItems="center">
                    <s-icon type="filter" size="small" tone="neutral"></s-icon>
                    <s-text fontSize="small-200">{toTitleCase(issue.type)} {toTitleCase(issue.category)} Issue</s-text>
                  </s-stack>
                  <s-stack direction="inline" gap="small-300" alignItems="center">
                    <s-icon type="calendar-time" size="small" tone="neutral"></s-icon>
                    <s-text fontSize="small-200">Detected {formatDateTime(issue.createdAt)}</s-text>
                  </s-stack>
                </s-stack>
              </s-stack>
            </s-stack>
          </s-section>
          <s-section heading="Status">
            <s-stack gap="small">
              <s-badge tone={issue.tone} icon="alert-circle">{toTitleCase(issue.tone)}</s-badge>
              <s-text>{issue.alert}</s-text>
              <s-stack direction="inline" gap="base">
                <s-button variant="primary" icon="check">Mark as resolved</s-button>
                <s-button variant="secondary" icon="hide">Ignore issue</s-button>
              </s-stack>
            </s-stack>
          </s-section>
          <s-section heading="Impact">
            <s-stack gap="small">
              <s-text tone={issue.tone}>{toTitleCase(issue.severity)}</s-text>
              <s-text>{issue.impact}</s-text>
            </s-stack>
          </s-section>
        </s-grid>
      </s-query-container>

      <s-query-container containerName="issue-details">
        <s-grid
          gridTemplateColumns="@container issue-details (inline-size <= 600px) 1fr, auto 300px"
          gap="base"
          paddingBlockEnd="base"
        >
          <s-section >
            <s-stack gap="base">
              <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
                <s-heading tone="subdued">Affected Variant</s-heading>
                {totalPages > 1 && (
                  <s-button>View all products</s-button>
                )}
              </s-grid>
              <s-table
                // paginate
                // hasPreviousPage
                // hasNextPage
                loading={isLoading}
                variant="@container issue-details (inline-size <= 600px) list, table"
              >
                {/* <s-search-field slot="filters" label="Search products" labelAccessibilityVisibility="exclusive" placeholder="Search products"></s-search-field> */}
                <s-table-header-row>
                  <s-table-header listSlot="primary">Product</s-table-header>
                  {issue.type === "variant" && (
                    <s-table-header listSlot="inline">Variant</s-table-header>
                  )}
                  <s-table-header listSlot="labeled">Issues</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {issue.data.length > 0 ? (
                    issue.data.map((item) => (
                      <s-table-row key={item.id}>
                        <s-table-cell>
                          <s-stack gap="large-100" direction="inline" alignItems="center">
                            {(() => {
                              const targetProduct = item.variant?.product || item.product;
                              const rawImage = targetProduct?.featuredImage;
                              let imageUrl = null;

                              if (rawImage && rawImage !== "null") {
                                try {
                                  imageUrl = JSON.parse(rawImage)?.url;
                                } catch (e) {
                                  imageUrl = null;
                                }
                              }

                              return (
                                <>
                                  <s-thumbnail
                                    src={imageUrl || undefined}
                                    alt={targetProduct?.title || "Product image"}
                                    size="small"
                                  />
                                  {/* <s-tooltip id={'product-'+item.id}>{targetProduct?.title}</s-tooltip>
                                  {targetProduct?.title.length > 30 ? (
                                    <s-text interestFor={'product-'+item.id}>{targetProduct?.title.slice(0, 30)+'...'}</s-text>
                                  ) : (
                                    <s-text interestFor={'product-'+item.id}>{targetProduct?.title}</s-text>
                                  )} */}
                                  <s-text>{targetProduct?.title || "-"}</s-text>
                                </>
                              );
                            })()}
                          </s-stack>
                        </s-table-cell>

                        {issue.type === "variant" && (
                          <s-table-cell>
                            {/* <s-tooltip id={item.id}>{item.variant.title}</s-tooltip>
                            {item.variant.title.length > 30 ? (
                              <s-text interestFor={item.id}>{item.variant.title.slice(0, 30)+'...'}</s-text>
                            ) : (
                              <s-text interestFor={item.id}>{item.variant.title}</s-text>
                            )} */}
                            <s-stack inlineSize="200px">
                              <s-text interestFor={item.id}>{item.variant.title}</s-text>
                            </s-stack>
                          </s-table-cell>
                        )}
                        
                        <s-table-cell>
                          <s-stack direction="inline" gap="small-200" alignItems="center">
                            <s-badge tone={issue.tone}>{issue.name}</s-badge>
                            <s-clickable-chip
                              color="subdued"
                              href="javascript:void(0)"
                              accessibilityLabel="View T-shirt product"
                              commandFor={'issue-'+item.id}
                            >
                              <s-icon size="small" slot="graphic" type="info"></s-icon>
                              Other issues
                            </s-clickable-chip>
                          </s-stack>
                          <s-popover id={'issue-'+item.id}>
                            <s-box padding="base">
                              <s-stack gap="small">
                                <s-stack gap="small-200">
                                  {(item.variant?.variantIssues || item.product?.productIssues || [])
                                    .filter((variantIssue) => variantIssue.issue.id !== item.issueId)
                                    .map((variantIssue) => (
                                      <s-badge key={variantIssue.issue.id} tone={variantIssue.issue.tone}>
                                        {variantIssue.issue.name}
                                      </s-badge>
                                    ))
                                  }
                                </s-stack>

                                <s-divider />

                                <s-button variant="secondary">View full inventory report</s-button>
                              </s-stack>
                            </s-box>
                          </s-popover>
                        </s-table-cell>
                      </s-table-row>
                    ))
                  ) : (
                    <s-table-row>
                      <s-table-cell>
                        {`No affected ${issue.type} found.`}
                      </s-table-cell>
                    </s-table-row>
                  )}
                </s-table-body>
              </s-table>

              {totalPages > 1 && (
                <s-stack direction="inline" alignItems="center" justifyContent="end" gap="base">
                  <s-button
                    disabled={page <= 1 || isLoading}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </s-button>

                  <s-grid gridTemplateColumns="auto 1fr auto" gap="small" alignItems="center">
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
            </s-stack>
          </s-section>

          <s-section heading="Related Issues">
            <s-stack gap="small">
              <s-text>{issue.count} {issue.type} have {issue.name.toLowerCase()}</s-text>
            </s-stack>
          </s-section>
        </s-grid>
      </s-query-container>

      <s-section heading="issue">
        <s-paragraph>
          <pre>{JSON.stringify(issue, null, 2)}</pre>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}