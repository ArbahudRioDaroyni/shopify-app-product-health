import db from "../../db.server.js";
import { rules } from "../rules/index.js";

export async function getIssueById(id) {
  const safeId = parseInt(id);
  return await db.issue.findUniqueOrThrow({
    where: { id: safeId },
		include: {
			productIssues: {
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
                    }
                  }
                }
              },
            }
          }
        }
      },
			variantIssues: {
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
                    }
                  }
                }
              },
              product: true,
            }
          }
        }
      },
		}
  });
}

export async function getIssueDetailsById({id}) {
  let issue = await getIssueById(id);
  const listIssue = issue.productIssues.length === 0 ? issue.variantIssues : issue.productIssues;
  const issueFromProductOrVariant = issue.productIssues.length === 0 ? 'variant' : 'product';

  issue.severity = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1).toLowerCase();
  issue.priority = toTitleCase(issue.priority);
  issue.count = listIssue.length;
  issue.type = issueFromProductOrVariant;
  delete issue.variantIssues;
  delete issue.productIssues;
  issue.data = listIssue;

  return issue;
}

export async function upsertIssue({db, item}) {
  const name = item.issue;
  const slug = convertToSlug(name);
  if (!slug) return null;

	const rule = ruleBySlug.find(rule => rule.id === slug);
  const issue = await db.issue.upsert({
    where: { slug },
    update: {
      summary: rule.summary || undefined,
      description: rule.description || undefined,
      category: rule.category || undefined,
      severity: rule.severity || undefined,
      priority: rule.priority || undefined,
      impact: rule.impact || undefined,
      alert: rule.alert || undefined,
      tone: rule.tone || undefined,
    },
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

function convertToSlug(text) {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toTitleCase(str) {
  return str
    .replace('_', ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}