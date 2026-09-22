import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const FALLBACK_COLORS = {
  critical: "#d82c0d",
  warning: "#b28400",
  info: "#0094d5",
  success: "#18864b",
  light: "#e8f3eb"
};

function renderTrendsTooltip({ chart, tooltip }) {
  const chartContainer = chart.canvas.parentNode;
  let tooltipElement = chartContainer.querySelector(".trends-tooltip");

  if (!tooltipElement) {
    tooltipElement = document.createElement("div");
    tooltipElement.className = "trends-tooltip";
    Object.assign(tooltipElement.style, {
      position: "absolute",
      transform: "translate(-50%, -100%)",
      padding: "4px 6px",
      borderRadius: "4px",
      background: "rgba(0, 0, 0, 0.8)",
      color: FALLBACK_COLORS.light,
      fontSize: "10px",
      lineHeight: "1.2",
      whiteSpace: "nowrap",
      pointerEvents: "none",
      zIndex: "1",
      transition: "opacity 100ms ease",
    });
    chartContainer.appendChild(tooltipElement);
  }

  if (tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
    tooltipElement.style.opacity = "0";
    return;
  }

  const point = tooltip.dataPoints[0];
  tooltipElement.textContent = `${point.label}, ${point.parsed.y} Issues`;
  tooltipElement.style.opacity = "1";
  tooltipElement.style.left = `${tooltip.caretX}px`;
  tooltipElement.style.top = `${tooltip.caretY - 6}px`;
}

export function TrendsChart({ data = [], tone }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const chartLabels = data.map((item) => {
      const dateObj = new Date(item.date);
      return dateObj.toLocaleDateString("en-EN", { weekday: "short" });
    });
    const chartValues = data.map((item) => item.count);

    const cssVarColor = getComputedStyle(canvasRef.current)
      .getPropertyValue(`--${tone}`)
      .trim();

    const borderColor = cssVarColor || FALLBACK_COLORS[tone] || FALLBACK_COLORS.info;

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartValues,
            borderColor,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.35,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: renderTrendsTooltip,
          },
        },
        scales: {
          x: { display: false },
          y: {
            display: false,
            beginAtZero: true
          },
        },
        elements: { line: { capBezierPoints: true } },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [data, tone]);

  return (
    <div style={{ width: "104px", height: "32px", position: "relative" }}>
      <canvas
        ref={canvasRef}
        aria-label="Seven day trends"
        style={{ paddingBlockStart: "4px", paddingBlockEnd: "4px" }}
      />
    </div>
  );
}

export function LineChart({ data, range, title }) {
  const selectedDays = Number(range ?? 7);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const since = Date.now() - selectedDays * 24 * 60 * 60 * 1000;
  const chartData = (data || [])
    .filter((scan) => new Date(scan.date).getTime() >= since)
    .reduce(
      (data, scan) => {
        data.labels.push(new Date(scan.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }));
        data.values.push(scan.count ?? 0);
        return data;
      },
      { labels: [], values: [] },
    );

    console.log(data || []);
    

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: title,
            data: chartData.values,
            borderColor: FALLBACK_COLORS.success,
            backgroundColor: FALLBACK_COLORS.light,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 5,
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (context) => `${title}, ${context.parsed.y}`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxTicksLimit: selectedDays === 7 ? 7 : 6,
            },
          },
          y: {
            // beginAtZero: true,
            suggestedMax: chartData.values.length ? Math.max(...chartData.values) : 100,
            ticks: {
							precision: 0,
							stepSize: 25,
						},
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [chartData, selectedDays, title]);

  return (
    <s-stack gap="base">
      <div style={{ height: "280px", position: "relative" }}>
        <canvas ref={canvasRef} aria-label={title} />
      </div>
    </s-stack>
  );
}

export function DonutChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Healthy", "Needs attention", "Critical"],
        datasets: [
          {
            data,
            backgroundColor: [
              FALLBACK_COLORS.success,
              FALLBACK_COLORS.warning,
              FALLBACK_COLORS.critical
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            display: false,
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div className="health-summary__chart">
      <canvas ref={canvasRef} />
    </div>
  );
}

TrendsChart.propTypes = {
  data: (props, propName, componentName) => {
    const value = props[propName];
    if (!Array.isArray(value)) {
      return new Error(`${componentName}: data must be an array`);
    }

    return null;
  },
  tone: (props, propName, componentName) => {
    const value = props[propName];
    if (!['success', 'info', 'warning', 'critical'].includes(value)) {
      return new Error(`${componentName}: tone must be success, info, warning, or critical`);
    }

    return null;
  },
};

LineChart.propTypes = {
  data: (props, propName, componentName) => {
    const value = props[propName];
    if (!Array.isArray(value)) {
      return new Error(`${componentName}: data must be an array`);
    }

    return null;
  },
  range: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== undefined && ![7, 30].includes(Number(value))) {
      return new Error(`${componentName}: range must be 7 or 30`);
    }

    return null;
  },
  title: (props, propName, componentName) => {
    const value = props[propName];
    if (typeof value !== 'string') {
      return new Error(`${componentName}: title must be a string`);
    }

    return null;
  },
};

DonutChart.propTypes = {
  data: (props, propName, componentName) => {
    const value = props[propName];
    if (!Array.isArray(value)) {
      return new Error(`${componentName}: data must be an array`);
    }

    return null;
  },
};