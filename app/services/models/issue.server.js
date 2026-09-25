import db from "../../db.server.js";
import { rules } from "../rules/index.js";
import { convertToSlug } from "../../utils/formatters.js";

export async function upsertIssue({db, item}) {
  const name = item.issue;
  const slug = convertToSlug(name);
  if (!slug) return null;

	const rule = ruleBySlug.find(rule => rule.id === slug) || {};
  const issue = await db.issue.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      name,
      summary: rule.summary || "",
      description: rule.description || "",
      category: rule.category || "General",
      severity: rule.severity || "LOW",
      priority: rule.priority || "improvement",
      impact: rule.impact || "",
      alert: rule.alert || "",
      tone: rule.tone || "info",
    },
  });

	return issue;
}

export async function getIssues({ shopId, search, priority, productStatus }) {
  // 1. Construct search conditions and the Priority filter for the Issue table
  const issueWhere = {};

  if (search) {
    issueWhere.name = {
      contains: search,
      // mode: 'insensitive' // Uncomment if using PostgreSQL/MySQL; SQLite does not support this natively.
    };
  }

  if (priority) {
    // Adjust the mapping from UI strings to Prisma Priority Enums
    const priorityMap = {
      improvement: "improvement",
      needs_attention: "needs_attention",
      critical: "critical",
    };
    issueWhere.priority = priorityMap[priority] || undefined;
  }

  // 2. Construct the filter condition for Product Status (ACTIVE, DRAFT, ARCHIVED)
  const productStatusCondition = productStatus && productStatus !== "ALL"
    ? { status: productStatus } 
    : {};

  // 3. Retrieve the issue data, as well as the affected products and variants, for this store.
  const issues = await db.issue.findMany({
    where: issueWhere,
    include: {
      productIssues: {
        where: {
          shopId: shopId,
          product: productStatusCondition, // Filter by product status
        },
        select: {
          productId: true,
        },
      },
      variantIssues: {
        where: {
          shopId: shopId,
          variant: {
            product: productStatusCondition, // Filter based on the status of the parent product variant
          },
        },
        select: {
          variantId: true,
          variant: {
            select: {
              product: true,
              productId: true, // Get the parent product ID so it can be combined
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // 4. Transform the data to calculate UNIQUE affected products (combining products & variants)
  const formattedIssues = issues.map((issue) => {
    const affectedProductIds = new Set();
    const affectedVariantIds = new Set();

    // Enter the product ID from the ProductIssue level
    issue.productIssues.forEach((pi) => affectedProductIds.add(pi.productId));

    // Enter the parent product ID from the VariantIssue level
    issue.variantIssues.forEach((vi) => {
      if (vi.variantId) {
        affectedVariantIds.add(vi.variantId);
      }
      if (vi.variant?.productId) {
        affectedProductIds.add(vi.variant.productId);
      }
    });

    // Map the Tone/Severity Enum for your UI badge requirements
    const severityDisplayMap = {
      LOW: "Info",
      MEDIUM: "Warning",
      HIGH: "Critical",
    };

    return {
      id: issue.id,
      slug: issue.slug,
      name: issue.name,
      description: issue.description,
      productsCount: affectedProductIds.size,
      variantsCount: affectedVariantIds.size,
      variantIds: [...affectedVariantIds],
      productIds: [...affectedProductIds],
      severity: severityDisplayMap[issue.severity],
      priority: issue.priority,
      tone: issue.tone,
    };
  });

  // Optional: If you want to hide issues currently affecting 0 products
  return formattedIssues.filter((issue) => issue.productsCount > 0);

  // return { issues, issueWhere, productStatusCondition, shopId };
  // const issues = await db.Issue.findMany({
  //   include: {
  //     productIssues: true,
  //     variantIssues: true,
  //     _count: {
  //       select: {
  //         productIssues: true,
  //         variantIssues: true,
  //       },
  //     },
  //   }
  // });

  // return issues;
}

export async function getIssueDetailsById({ id, page = 1, pageSize = 10 }) {
  const safeId = parseInt(id);
  const skip = (page - 1) * pageSize;

  const issue = await db.issue.findUniqueOrThrow({
    where: { id: safeId },
		include: {
      _count: {
        select: {
          productIssues: true,
          variantIssues: true,
        },
      },
			productIssues: {
        skip,
        take: pageSize,
        include: {
          product: {
            include: {
              productIssues: {
                select: {
                  issue: {
                    select: {
                      id: true,
                      name: true,
                      tone: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
			variantIssues: {
        skip,
        take: pageSize,
        include: {
          variant: {
            include: {
              variantIssues: {
                select: {
                  issue: {
                    select: {
                      id: true,
                      name: true,
                      tone: true,
                    },
                  },
                },
              },
              product: true,
            }
          }
        }
      },
		}
  });

  issue.count = issue._count.productIssues + issue._count.variantIssues;
  issue.productCount = issue._count.productIssues;
  issue.variantCount = issue._count.variantIssues;
  issue.type = issue._count.productIssues > 0 ? 'product' : 'variant';
  issue.data = issue._count.productIssues > 0 ? issue.productIssues : issue.variantIssues;
  delete issue.variantIssues;
  delete issue.productIssues;
  delete issue._count;

  return issue;
}

export async function recordDailyIssueTrends({db, shopId}) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const issues = await db.issue.findMany({
    select: {
      id: true,
      productIssues: {
        select: {
          product: {
            select: {
              status: true
            }
          }
        }
      },
      variantIssues: {
        select: {
          variant: {
            select: {
              product: {
                select: {
                  status: true
                }
              }
            }
          }
        }
      }
    },
  });

  const data = issues
    .map(issue => {
      const issuesCombined = [...issue.productIssues, ...issue.variantIssues];
      const counts = issuesCombined.reduce((acc, issue) => {
        const status = issue.product?.status ?? issue.variant?.product?.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts).map(([key, value]) => {
        return {
          shopId: shopId,
          issueId: issue.id,
          status: key,
          count: value,
          date: today
        };
      });
    })
    .flatMap(issue => issue);

  for (const issue of data) {
    await db.IssueTrend.upsert({
      where: {
        shopId_issueId_status_date: {
          shopId,
          issueId: issue.issueId,
          status: issue.status,
          date: today,
        },
      },
      update: { count: issue.count },
      create: {
        shopId,
        issueId: issue.issueId,
        count: issue.count,
        status: issue.status,
        date: today,
      },
    });
  }
}

export async function getIssueTrends() {
  const data = await db.Issue.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      severity: true,
      category: true,
      tone: true,
      issueTrends: {
        select: {
          date: true,
          status: true,
          count: true
        },
        take: 7,
        orderBy: {
          date: "desc"
        }
      }
    }
  });

  // 1. Buat daftar 7 hari terakhir dari HARI INI (Urutan dari terlama -> terbaru)
  const last7DaysDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return data
    .map(issue => {
      const maxTimestamp = Math.max(...issue.issueTrends.map(item => new Date(item.date).getTime()));
      const latestIssues = issue.issueTrends.filter(
        item => new Date(item.date).getTime() === maxTimestamp
      );

      const countAll = latestIssues.reduce((sum, item) => sum + item.count, 0);

      // 2. Petakan data dari DB ke trendMap menggunakan key berformat YYYY-MM-DD
      const trendMap = {};
      issue.issueTrends.forEach(item => {
        const dateObj = new Date(item.date);
        // Ambil bagian tanggalnya saja (YYYY-MM-DD) agar data di hari yang sama terakumulasi
        const dateKey = dateObj.toISOString().split('T')[0]; 
        
        if (!trendMap[dateKey]) {
          trendMap[dateKey] = 0;
        }
        trendMap[dateKey] += item.count;
      });

      // 3. Gabungkan pola 7 hari terakhir dengan trendMap. 
      const trendAll = last7DaysDates.map(date => {
        const dateKey = date.toISOString().split('T')[0];
        
        return {
          // Output akhir menggunakan format ISO penuh: 2026-09-09T14:20:54.422Z
          date: date.toISOString(), 
          count: trendMap[dateKey] || 0
        };
      });

      // 5. Kembalikan format sesuai keinginan Anda
      return {
        ...issue,
        latest: latestIssues,
        countAll: countAll,
        trendAll: trendAll
      };
    })
    .sort((a, b) => b.countAll - a.countAll);
}

const ruleBySlug = rules.map((rule) => ({
	...rule,
}));