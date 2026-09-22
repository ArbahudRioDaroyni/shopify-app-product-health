export default function TotalProducts({ total, healthy, warning, critical }) {
  const percentage = (value) => total
    ? Math.round((value / total) * 100)
    : 0;

  return (
    <s-grid gap="base">
      <s-heading>Total Products</s-heading>
      <p className="health-summary__main-text">{total}</p>
      <s-grid gap="small-300">
        <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
          <s-stack direction="inline" gap="small-300" alignItems="center">
            <i className="catalog-health__dot" aria-hidden="true" />
            Healthy
          </s-stack>
          <s-text>{healthy} ({percentage(healthy)}%)</s-text>
        </s-grid>
        <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
          <s-stack direction="inline" gap="small-300" alignItems="center">
            <i className="catalog-health__dot amber" aria-hidden="true" />
            Need attention
          </s-stack>
          <s-text>{warning} ({percentage(warning)}%)</s-text>
        </s-grid>
        <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
          <s-stack direction="inline" gap="small-300" alignItems="center">
            <i className="catalog-health__dot red" aria-hidden="true" />
            Critical
          </s-stack>
          <s-text>{critical} ({percentage(critical)}%)</s-text>
        </s-grid>
      </s-grid>
    </s-grid>
  );
}

TotalProducts.propTypes = {
  total: (props, propName, componentName) => {
    if (typeof props[propName] !== "number") {
      return new Error(`${componentName}: total must be a number`);
    }

    return null;
  },
  healthy: (props, propName, componentName) => {
    if (typeof props[propName] !== "number") {
      return new Error(`${componentName}: healthy must be a number`);
    }

    return null;
  },
  warning: (props, propName, componentName) => {
    if (typeof props[propName] !== "number") {
      return new Error(`${componentName}: warning must be a number`);
    }

    return null;
  },
  critical: (props, propName, componentName) => {
    if (typeof props[propName] !== "number") {
      return new Error(`${componentName}: critical must be a number`);
    }

    return null;
  },
  // productHealth: (props, propName, componentName) => {
  //   const value = props[propName];
  //   if (!value || !["total", "healthy", "warning", "critical"].every((key) => typeof value[key] === "number")) {
  //     return new Error(`${componentName}: productHealth must include numeric health counts`);
  //   }

  //   return null;
  // },
};
