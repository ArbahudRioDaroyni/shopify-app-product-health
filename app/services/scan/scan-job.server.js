import prisma from "../../db.server.js";

export async function createScanJob({ shopId, type = "FULL" }) {
  return prisma.scanJob.create({
    data: {
      shopId,
      type,
      status: "PENDING",
    },
  });
}

export async function getNextPendingJob() {
  const job = await prisma.scanJob.findFirst({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return job;
}

export async function claimScanJob(jobId) {
  const result = await prisma.scanJob.updateMany({
    where: {
      id: jobId,
      status: "PENDING",
    },
    data: {
      status: "PROCESSING",
      startedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    return null;
  }

  return prisma.scanJob.findUnique({
    where: {
      id: jobId,
    },
  });
}

export async function completeScanJob(jobId) {
  return prisma.scanJob.update({
    where: {
      id: jobId,
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

export async function failScanJob(jobId, error) {
  return prisma.scanJob.update({
    where: {
      id: jobId,
    },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorMessage:
        error instanceof Error
          ? error.message
          : String(error),
    },
  });
}