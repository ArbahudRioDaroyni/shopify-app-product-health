import db from "../../db.server.js";

export async function getTopIssues({shopId}) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  // 1. Ambil record 7 hari terakhir
  const records = await db.topIssueSummary.findMany({
    where: {
      shopId,
      date: { gte: sevenDaysAgo },
    },
    include: { issue: true },
    orderBy: { date: "asc" },
  });

  // 2. Grouping per Issue, lalu per ProductStatus
  const groupedMap = new Map();

  for (const record of records) {
    if (!groupedMap.has(record.issueId)) {
      groupedMap.set(record.issueId, {
        id: record.issueId,
        name: record.issue.name,
        description: record.issue.description,
        severity: record.issue.severity,
        category: record.issue.category,
        tone: record.issue.tone,
        statusMap: new Map(), // status -> { trendMap: {} }
      });
    }

    const issueGroup = groupedMap.get(record.issueId);

    if (!issueGroup.statusMap.has(record.status)) {
      issueGroup.statusMap.set(record.status, {
        productStatus: record.status,
        trendMap: {}, // dateStr -> count
      });
    }

    const statusGroup = issueGroup.statusMap.get(record.status);
    const dateStr = record.date.toISOString().split("T")[0];
    statusGroup.trendMap[dateStr] = record.count;
  }

  // 3. Format output sesuai JSON baru
  const formattedIssues = Array.from(groupedMap.values()).map((issue) => {
    let totalCountAllStatus = 0;

    const results = Array.from(issue.statusMap.values()).map((statusGroup) => {
      const trendValues = Object.values(statusGroup.trendMap);
      const latestCount = trendValues[trendValues.length - 1] || 0;
      totalCountAllStatus += latestCount;

      return {
        productStatus: statusGroup.productStatus,
        count: latestCount,
        trend: trendValues,
      };
    });

    return {
      id: issue.id,
      name: issue.name,
      description: issue.description,
      severity: issue.severity,
      category: issue.category,
      tone: issue.tone,
      totalCount: totalCountAllStatus, // Untuk keperluan sortir internal
      results,
    };
  });

  // 4. Sortir berdasarkan isu yang punya total count terbanyak, lalu potong sesuai limit
  return formattedIssues
    .sort((a, b) => b.totalCount - a.totalCount)
    // .slice(0, limit)
    .map((item) => {
      delete item.totalCount;
      return item;
    });
}

export async function recalculateTopIssues({db, shopId}) {
  const productIssues = await db.productIssue.findMany({
    include: { issue: true, product: true },
  });

  const variantIssues = await db.variantIssue.findMany({
    include: {
      issue: true,
      variant: { include: { product: true } },
    },
  });

  const variantIssuesFormatted = variantIssues.map((item) => ({
    ...item,
    product: item.variant.product,
  }));

  const allIssues = [...productIssues, ...variantIssuesFormatted];

	const aggregatedData = Object.values(
    allIssues.reduce((acc, current) => {
      const key = `${current.issueId}_${current.product.status}`;

      if (!acc[key]) {
        acc[key] = {
          issueId: current.issueId,
          count: 1,
          status: current.product.status,
        };
      } else {
        acc[key].count += 1;
      }

      return acc;
    }, {})
  );

  const today = new Date();
  // today.setUTCHours(0, 0, 0, 0);

  for (const item of aggregatedData) {
    await db.topIssueSummary.upsert({
      where: {
        shopId_issueId_status_date: {
          shopId,
          issueId: item.issueId,
          status: item.status,
          date: today,
        },
      },
      update: { count: item.count },
      create: {
        shopId,
        issueId: item.issueId,
        count: item.count,
        status: item.status,
        date: today,
      },
    });
  }
}

export async function getTopIssuesNew() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  // {
  //   "id": 79,
  //   "name": "Variant Missing Image",
  //   "description": "Specific product variants without assigned variant images.",
  //   "severity": "LOW",
  //   "category": "media",
  //   "tone": "info",
  //   "results": [
  //     {
  //       "productStatus": "ACTIVE",
  //       "count": 188,
  //       "trend": [
  //         188
  //       ]
  //     },
  //     {
  //       "productStatus": "ARCHIVED",
  //       "count": 6,
  //       "trend": [
  //         6
  //       ]
  //     }
  //   ]
  // },

  const test = await db.issue.findMany({
    where: {},
    select: {
      id: true,
      name: true,
      description: true,
      severity: true,
      category: true,
      tone: true,
      topIssueSummaries: true
      // topIssueSummaries: {
      //   select: {
      //     count: true,
      //     status: true,
      //   }
      // }
    },
  });

  return test;
}