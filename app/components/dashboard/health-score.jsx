import { DonutChart } from "../chart";

export default function HealthScore({ data }) {
  const score = data.healthScore;
  const totalIssues = data.totalIssues;
  const totalCriticalIssues = data.highIssues;
  const productHealthList = [
    data.healthyProducts,
    data.needsAttentionProducts,
    data.criticalProducts
  ];

  const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "critical";
  const label = score >= 80 ? "Good" : score >= 60 ? "Needs attention" : "Critical";

  return (
    <s-grid gap="base">
      <s-heading>Health Score</s-heading>
      <s-grid gridTemplateColumns="1fr auto" alignItems="center">
        <s-stack gap="base">
          <s-stack direction="inline" gap="small-300" alignItems="safe end">
            <span className="health-summary__jumbo-text">{score}</span>
            <span className="health-summary__main-text">/</span>
            <span className="health-summary__main-text">100</span>
          </s-stack>
          <s-text tone={tone}>{label}</s-text>
        </s-stack>
        <DonutChart data={productHealthList} />
      </s-grid>
      <s-stack direction="inline" gap="small-200">
        <s-badge tone="auto">{totalIssues} issues</s-badge>
        <s-text>{totalCriticalIssues} critical</s-text>
      </s-stack>
    </s-grid>
  );
}

HealthScore.propTypes = {
  data: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== "object") {
      return new Error(`${componentName}: data must be an object or null`);
    }

    return null;
  },
};
