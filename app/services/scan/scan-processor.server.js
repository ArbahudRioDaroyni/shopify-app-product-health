import prisma from "../../db.server.js";

async function runActualScan({ _shopId }) {
  // TODO:
  // Call Shopify Admin GraphQL API here.
  //
  // Return only scan-level results for now.

  return {
    totalProducts: 10,
    healthyProducts: 7,
    needsAttentionProducts: 2,
    criticalProducts: 1,

    totalIssues: 5,
    highIssues: 1,
    mediumIssues: 2,
    lowIssues: 2,

    healthScore: 82,
  };
}

export async function processScanJob(job) {
  const startedAt = new Date();

  const scan = await prisma.scan.create({
    data: {
      shopId: job.shopId,
      scanJobId: job.id,
      type: job.type,
      status: "PROCESSING",
      startedAt,
    },
  });

  try {
    const result = await runActualScan({
      shopId: job.shopId,
    });

    return await prisma.$transaction([
      prisma.scan.update({
        where: {
          id: scan.id,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),

          healthScore: result.healthScore,

          totalProducts: result.totalProducts,
          healthyProducts: result.healthyProducts,
          needsAttentionProducts: result.needsAttentionProducts,
          criticalProducts: result.criticalProducts,

          totalIssues: result.totalIssues,
          highIssues: result.highIssues,
          mediumIssues: result.mediumIssues,
          lowIssues: result.lowIssues,
        },
      }),

      prisma.scanJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      }),
    ]);
  } catch (error) {
    await prisma.$transaction([
      prisma.scan.update({
        where: {
          id: scan.id,
        },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage:
            error instanceof Error
              ? error.message
              : String(error),
        },
      }),

      prisma.scanJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage:
            error instanceof Error
              ? error.message
              : String(error),
        },
      }),
    ]);

    throw error;
  }
}