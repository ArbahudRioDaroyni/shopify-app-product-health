import { useState } from "react";
import { LineChart } from "../chart";

const HEALTH_SCORE_FILTERS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
];

export default function HealthScoreOverTime({ history }) {
  const [dateRange, setDateRange] = useState(7);

  let combinedTrend;
  if (history.length > 0 && history.length < dateRange) {
    const missingCount = dateRange - history.length;
    const baseDate = new Date(history[0].createdAt);

    const padding = Array(missingCount).fill(null).map((_, index) => {
      const dayOffset = missingCount - index; 
      const cloneDate = new Date(baseDate);
      cloneDate.setDate(cloneDate.getDate() - dayOffset);

      return {
        ...history[0],
        healthScore: 0,
        createdAt: cloneDate.toISOString()
      };
    });

    combinedTrend = [...padding, ...history];
  }

  const data = combinedTrend.map(({ healthScore: count, createdAt: date }) => ({
    count,
    date
  }));

  return (
    <s-section accessibilityLabel="Health Score Over Time">
      <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
        <s-heading>Health Score Over Time</s-heading>
        <s-button
          commandFor="health-score-date-range-menu"
          variant="secondary"
          icon="calendar"
          accessibilityLabel="Pick a date range"
        >
          {HEALTH_SCORE_FILTERS.find((filter) => filter.days === dateRange)?.label}
        </s-button>
        <s-menu
          id="health-score-date-range-menu"
          accessibilityLabel="Health score date range"
        >
          {HEALTH_SCORE_FILTERS.map((filter) => (
            <s-button
              key={filter.days}
              icon={dateRange === filter.days ? "check" : undefined}
              onClick={() => setDateRange(filter.days)}
              accessibilityLabel={filter.label}
            >
              {filter.label}
            </s-button>
          ))}
        </s-menu>
      </s-grid>
      <LineChart range={dateRange} data={data} title="Health Score" />
    </s-section>
  );
}

HealthScoreOverTime.propTypes = {
  history: (props, propName, componentName) => {
    if (!Array.isArray(props[propName])) {
      return new Error(`${componentName}: history must be an array`);
    }

    return null;
  },
};
