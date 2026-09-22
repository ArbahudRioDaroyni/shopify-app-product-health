import db from "../../db.server";

export async function fetchMonthlyDashboardSnapshot({shopId}) {
	const data = await db.dashboardSnapshot.findMany({
		where: { shopId },
		orderBy: { createdAt: "asc" },
		take: 30,
	});

	return data;
}

export async function fetchLatestDashboardSnapshot({shopId}) {
	const data = await db.dashboardSnapshot.findFirst({
		where: { shopId },
		orderBy: { createdAt: "desc" },
	});

	return data;
}

export async function storeDashboardSnapshot({db, shopId, scanType, startedAt}) {
	const totalProducts = await db.product.count();

	const productIssues = await db.productIssue.findMany({
		include: { issue: true, product: true },
	});

	const variantIssues = await db.variantIssue.findMany({
		include: { issue: true, variant: { include: { product: true } } },
	});

	const productHealthMap = new Map();
	let highIssues = 0;
	let mediumIssues = 0;
	let lowIssues = 0;

	const processIssueSeverity = (productId, severity) => {
		if (severity === "HIGH") highIssues++;
		else if (severity === "MEDIUM") mediumIssues++;
		else lowIssues++;

		const current = productHealthMap.get(productId);
		if (!current || severity === "HIGH" || (severity === "MEDIUM" && current === "LOW")) {
			productHealthMap.set(productId, severity);
		}
	};

	for (const pi of productIssues) {
		processIssueSeverity(pi.productId, pi.issue.severity);
	}
	for (const vi of variantIssues) {
		processIssueSeverity(vi.variant.productId, vi.issue.severity);
	}

	let criticalProducts = 0;
	let needsAttentionProducts = 0;

	for (const severity of productHealthMap.values()) {
		if (severity === "HIGH") criticalProducts++;
		else if (severity === "MEDIUM") needsAttentionProducts++;
	}

	const healthyProducts = Math.max(0, totalProducts - productHealthMap.size);
	const totalIssues = highIssues + mediumIssues + lowIssues;

	const calculateHealthScore = ({ totalProducts, criticalProducts, needsAttentionProducts, lowIssues }) => {
		if (!totalProducts || totalProducts === 0) return 100;
		const penalty = (criticalProducts * 15) + (needsAttentionProducts * 5) + (lowIssues * 1);

		const score = Math.max(0, 100 - Math.round(penalty / totalProducts));
		return score;
	}

	const healthScore = calculateHealthScore({
		totalProducts,
		criticalProducts,
		needsAttentionProducts,
		lowIssues,
	});

	return await db.dashboardSnapshot.create({
		data: {
			shopId,
			status: "completed",
			scanType,
			startedAt,
			completedAt: new Date(),
			healthScore,
			totalProducts,
			healthyProducts,
			needsAttentionProducts,
			criticalProducts,
			totalIssues,
			highIssues,
			mediumIssues,
			lowIssues,
		},
	});
}