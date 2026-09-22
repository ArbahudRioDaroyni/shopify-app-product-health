import { useState, useMemo } from "react";
import { TrendsChart } from "../chart";

const MAX_ISSUES_PER_CATEGORY = 2;

const PRODUCT_STATUS_FILTERS = [
  { key: "all", label: "All Status" },
  { key: "ACTIVE", label: "Active" },
  { key: "DRAFT", label: "Draft" },
  { key: "ARCHIVED", label: "Archive" },
];

const ISSUE_FILTERS = [
  { key: "all", label: "All Severity" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Improvement" },
];

export default function TopIssues({ data = [] }) {
  const [activeIssueFilter, setActiveIssueFilter] = useState("all");
  const [activeProductStatus, setActiveProductStatus] = useState("all");

  const filteredIssuesNew = useMemo(() => {
    const processed = data
      .map((issue) => {
        const filteredResultsByProductStatus = issue.latest.filter(
          (latest) => activeProductStatus === "all" || latest.status === activeProductStatus
        );

        if (filteredResultsByProductStatus.length === 0) return null;

        const filteredTotalCount = filteredResultsByProductStatus.reduce((sum, result) => sum + result.count, 0);

        return {
          ...issue,
          countAll: filteredTotalCount
        };
      })
      .filter(Boolean);

    if (activeIssueFilter !== "all") {
      return processed.filter((issue) => issue.tone === activeIssueFilter);
    }

    const categoryCounts = { critical: 0, warning: 0, info: 0 };

    return processed.filter((issue) => {
      const currentCategoryCount = categoryCounts[issue.tone] || 0;
      if (currentCategoryCount < MAX_ISSUES_PER_CATEGORY) {
        categoryCounts[issue.tone] = currentCategoryCount + 1;
        return true;
      }
      return false;
    });
  }, [data, activeIssueFilter, activeProductStatus]);

  const issueFilterCounts = useMemo(() => {
    return data.reduce(
      (acc, issue) => {
        const hasMatchingStatus = issue.latest.some(
          (latest) => activeProductStatus === "all" || latest.productStatus === activeProductStatus
        );
        if (hasMatchingStatus) {
          acc[issue.tone] = (acc[issue.tone] || 0) + 1;
          acc.all += 1;
        }
        return acc;
      },
      { all: 0, critical: 0, warning: 0, info: 0 }
    );
  }, [data, activeProductStatus]);

  return (
    <s-section heading="Top Issues">
      <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
        <s-grid gap="large-100">
          
          {/* Filter Dropdowns */}
          <s-stack direction="inline" gap="small-300" alignItems="center">
            {/* Severity Filter */}
            <s-button commandFor="top-issues-severity-menu" variant="secondary">
              Issue: {ISSUE_FILTERS.find((f) => f.key === activeIssueFilter)?.label}
            </s-button>
            <s-menu id="top-issues-severity-menu" accessibilityLabel="Issue severity filter">
              {ISSUE_FILTERS.map((filter) => (
                <s-button
                  key={filter.key}
                  icon={activeIssueFilter === filter.key ? "check" : undefined}
                  onClick={() => setActiveIssueFilter(filter.key)}
                  accessibilityLabel="Select severity issue for filter"
                >
                  {filter.label} ({issueFilterCounts[filter.key] || 0})
                </s-button>
              ))}
            </s-menu>

            {/* Product Status Filter */}
            <s-button commandFor="top-issues-status-menu" variant="secondary">
              Product Status: {PRODUCT_STATUS_FILTERS.find((f) => f.key === activeProductStatus)?.label}
            </s-button>
            <s-menu id="top-issues-status-menu" accessibilityLabel="Product status filter">
              {PRODUCT_STATUS_FILTERS.map((filter) => (
                <s-button
                  key={filter.key}
                  icon={activeProductStatus === filter.key ? "check" : undefined}
                  onClick={() => setActiveProductStatus(filter.key)}
                  accessibilityLabel="Select product status issue for filter"
                >
                  {filter.label}
                </s-button>
              ))}
            </s-menu>
          </s-stack>

          {/* Issue List */}
          <s-stack gap="small-300">
            {filteredIssuesNew.map((issue, index, array) => (
              <s-stack gap="small-300" key={issue.id}>
                <s-clickable accessibilityLabel={issue.name} href={`/app/issue/details/${issue.id}`}>
                  <s-tooltip id={`tooltip-${issue.id}`}>{issue.description}</s-tooltip>
                  <s-grid
                    gridTemplateColumns="auto 1fr auto 32px auto"
                    gap="small"
                    alignItems="center"
                    paddingBlock="small-300"
                  >
                    <s-box padding="small-500" background="transparent" border="base" borderColor="strong" borderRadius="base">
                      <s-icon type="alert-circle" tone={issue.tone} interestFor={`tooltip-${issue.id}`} />
                    </s-box>
                    <s-stack gap="small-500">
                      <s-heading>{issue.name}</s-heading>
                    </s-stack>
                    {/* Warna chart dikirim berdasarkan issue.tone asli */}
                    <TrendsChart data={issue.trendAll} tone={issue.tone} />
                    <s-heading>{issue.countAll}</s-heading>
                    <s-icon type="caret-right" accessibilityLabel="See products" />
                  </s-grid>
                </s-clickable>
                {index !== array.length - 1 && <s-divider />}
              </s-stack>
            ))}
          </s-stack>

          <s-link href="#beep">View all issues</s-link>
        </s-grid>
      </s-grid>
    </s-section>
  );
}

TopIssues.propTypes = {
  data: (props, propName, componentName) => {
    if (!Array.isArray(props[propName])) {
      return new Error(`${componentName}: data must be an array`);
    }

    return null;
  }
};
