import { useState, useMemo } from "react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { getIssueDetailsById } from "../services/models/issue.server";
import { getVariantById } from "../services/shopify/products.server";
import styles from "../styles.css?url";

export const links = () => [{ rel: "stylesheet", href: styles }];

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);
  const id = params.id;
  const issue = await getIssueDetailsById({id: params.id});
  const test = await getVariantById(admin, String(44211883900964));

  return {
    id,
    issue,
    test
  };
}

export default function IssueDetail() {
  const {
    id,
    issue,
    // test
  } = useLoaderData();

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(issue.count / ITEMS_PER_PAGE);

  const currentVariants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return issue.data.slice(startIndex, endIndex);
  }, [issue.data, currentPage]);

  const handlePrevious = () => {
    setCurrentPage((page) => Math.max(page - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((page) =>
      Math.min(page + 1, totalPages)
    );
  };

  return (
    <s-page heading={`Issue Detail: ${id}`} inlineSize="large" className="app-catalog-health">
      <s-query-container containerName="issue-details">
        <s-grid
          gridTemplateColumns="@container issue-details (inline-size <= 600px) 1fr, auto 300px 300px"
          gap="base"
          paddingBlockEnd="base"
        >
          <s-section>
            <s-stack gap="small">
              <s-badge tone={issue.tone} icon="alert-circle">{issue.priority}</s-badge>
              <s-stack gap="small-500">
                <p className="health-summary__main-text">{issue.name}</p>
                <s-text color="subdued">{issue.summary}</s-text>
              </s-stack>
              <s-text>{issue.description}</s-text>
            </s-stack>
          </s-section>
          <s-section>
            <s-stack gap="small">
              <s-heading tone="subdued">Status</s-heading>
              <s-badge tone={issue.tone} icon="alert-circle">{issue.priority}</s-badge>
              <s-text>{issue.alert}</s-text>
              <s-stack direction="inline" gap="base">
                <s-button variant="primary" icon="check">Mark as resolved</s-button>
                <s-button variant="secondary" icon="disabled">Ignore issue</s-button>
              </s-stack>
            </s-stack>
          </s-section>
          <s-section>
            <s-stack gap="small">
              <s-heading tone="subdued">Impact</s-heading>
              <s-text tone={issue.tone}>{issue.severity}</s-text>
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
            <s-stack gap="small">
              <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
                <s-heading tone="subdued">Affected Variant</s-heading>
                {totalPages > 1 && (
                  <s-button>View all products</s-button>
                )}
              </s-grid>
              <s-table>
                <s-table-header-row>
                  <s-table-header listSlot="primary">Product</s-table-header>
                  {issue.type === "variant" && (
                    <s-table-header listSlot="inline">Variant</s-table-header>
                  )}
                  <s-table-header listSlot="labeled">Issues</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {currentVariants.length > 0 ? (
                    currentVariants.map((item) => (
                      <s-table-row key={item.id}>
                        <s-table-cell>
                          <s-stack gap="large-100" direction="inline" alignItems="center">
                            {item.variant ? (
                              <s-thumbnail
                                src={JSON.parse(item.variant?.product.featuredImage).url}
                                alt="Image of indoor plant"
                                size="small"
                              ></s-thumbnail>
                            ) : (
                              item.product?.featuredImage != "null" ? (
                                <s-thumbnail
                                  src={JSON.parse(item.product?.featuredImage).url}
                                  alt="Image of indoor plant"
                                  size="small"
                                ></s-thumbnail>
                              ) : (
                                <s-thumbnail
                                  alt="Image of indoor plant"
                                  size="small"
                                ></s-thumbnail>
                              )
                            )}
                            <s-text>{item.product?.title || item.variant?.product.title}</s-text>
                          </s-stack>
                        </s-table-cell>

                        {issue.type === "variant" && (
                          <s-table-cell>
                            <s-tooltip id={item.id}>{item.variant.title}</s-tooltip>
                            {item.variant.title.length > 30 ? (
                              <s-text interestFor={item.id}>{item.variant.title.slice(0, 30)+'...'}</s-text>
                            ) : (
                              <s-text interestFor={item.id}>{item.variant.title}</s-text>
                            )}
                          </s-table-cell>
                        )}
                        
                        <s-table-cell>
                          <s-stack direction="inline" gap="small-200" alignItems="center">
                            <s-chip color="strong" accessibilityLabel={issue.name}>
                              {issue.name}
                            </s-chip>
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
                                  {item.variant?.variantIssues ? (
                                    item.variant.variantIssues.map((variantIssue) => (
                                      <s-badge key={variantIssue.issue.id} tone={variantIssue.issue.tone}>
                                        {variantIssue.issue.name}
                                      </s-badge>
                                    ))
                                  ) : (
                                    item.product.productIssues.map((productIssue) => (
                                      <s-badge key={productIssue.issue.id} tone={productIssue.issue.tone}>
                                        {productIssue.issue.name}
                                      </s-badge>
                                    ))
                                  )}
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
                    disabled={currentPage === 1}
                    onClick={handlePrevious}
                  >
                    Previous
                  </s-button>

                  <s-text alignment="center">
                    Page {currentPage} of {totalPages}
                  </s-text>

                  <s-button
                    disabled={currentPage === totalPages}
                    onClick={handleNext}
                  >
                    Next
                  </s-button>
                </s-stack>
              )}
            </s-stack>
          </s-section>

          <s-section>
            <s-stack gap="small">
              <s-text>{issue.count} {issue.type} have {issue.name.toLowerCase()}</s-text>
            </s-stack>
          </s-section>
        </s-grid>
      </s-query-container>

      {/* <s-section heading="test">
        <s-paragraph>
          <pre>{JSON.stringify(currentVariants, null, 2)}</pre>
        </s-paragraph>
      </s-section> */}
      <s-section heading="issue">
        <s-paragraph>
          <pre>{JSON.stringify(issue, null, 2)}</pre>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}