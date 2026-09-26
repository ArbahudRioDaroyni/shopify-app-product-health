import {
  getNextPendingJob,
  claimScanJob,
} from "./scan-job.server.js";

import { processScanJob } from "./scan-processor.server.js";

export async function processNextScanJob() {
  const pendingJob = await getNextPendingJob();

  if (!pendingJob) {
    return {
      processed: false,
      reason: "NO_JOB",
    };
  }

  const job = await claimScanJob(pendingJob.id);

  if (!job) {
    return {
      processed: false,
      reason: "JOB_ALREADY_CLAIMED",
    };
  }

  await processScanJob(job);

  return {
    processed: true,
    jobId: job.id,
  };
}