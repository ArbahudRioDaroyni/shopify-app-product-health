import { processNextScanJob } from "./scan-worker.server.js";

export async function runScanWorker({
  maxJobs = 1,
} = {}) {
  const results = [];

  for (let i = 0; i < maxJobs; i++) {
    const result = await processNextScanJob();

    results.push(result);

    if (!result.processed) {
      break;
    }
  }

  return results;
}