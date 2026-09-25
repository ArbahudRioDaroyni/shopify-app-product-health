import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";

function formatLastScanTime(lastScanAt) {
  if (!lastScanAt || lastScanAt === "null") return "No completed scan yet";

  const scanDate = new Date(lastScanAt);
  if (isNaN(scanDate.getTime())) return "No completed scan yet";

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - scanDate.getTime()) / 1000));
  if (elapsedSeconds < 60) return "Just now";

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} ago`;
}

export default function LastScan({ lastScanAt, isUpdating }) {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.data?.started) revalidator.revalidate();
  }, [fetcher.data, revalidator]);

  useEffect(() => {
    if (!isUpdating) return undefined;

    const interval = setInterval(() => revalidator.revalidate(), 2000);
    return () => clearInterval(interval);
  }, [isUpdating, revalidator]);

  const hasNeverScanned = !lastScanAt || lastScanAt === "null";

  return (
    <s-stack gap="base">
      <s-heading>Last scan</s-heading>
      <s-stack gap="small-400">
        <s-stack direction="inline" gap="small-300" alignItems="center">
          <p className="health-summary__main-text">
            {isUpdating ? "Scan in progress..." : formatLastScanTime(lastScanAt)}
          </p>
          <s-icon 
            type={isUpdating ? "refresh" : hasNeverScanned ? "alert-circle" : "check-circle"} 
            tone={isUpdating ? "info" : hasNeverScanned ? "warning" : "success"}
          ></s-icon>
        </s-stack>
        <s-text>
          {isUpdating 
            ? "Dashboard will refresh when it completes." 
            : hasNeverScanned 
              ? "Please run a scan to analyze your catalog health." // Pesan jika database kosong
              : "Catalog is up to date."
          }
        </s-text>
      </s-stack>
      <s-button
        variant="secondary"
        loading={fetcher.state !== "idle" || isUpdating}
        onClick={() => fetcher.submit({}, { method: "post" })}
      >
        Scan now
      </s-button>
    </s-stack>
  );
}

LastScan.propTypes = {
  lastScanAt: (props, propName, componentName) => {
    const value = props[propName];
    if (value !== null && value !== undefined && typeof value !== "string") {
      return new Error(`${componentName}: lastScanAt must be a date string or null`);
    }
    return null;
  },
  isUpdating: (props, propName, componentName) => {
    if (typeof props[propName] !== "boolean") {
      return new Error(`${componentName}: isUpdating must be a boolean`);
    }
    return null;
  },
};
