const SEVERITY_KEYS = ["critical", "warning", "improvement"];

function getSeverity(rule) {
	const value = String(rule.tone || rule.severity || "improvement").toLowerCase();

	if (value === "critical") return "critical";
	if (value === "warning" || value === "needs attention") return "warning";
	return "improvement";
}

export function summarizeIssues(scanResult = []) {
	const summary = {
		total: 0,
		critical: 0,
		warning: 0,
		improvement: 0,
		byRule: [],
	};

	for (const rule of scanResult) {
		const count = Array.isArray(rule.results) ? rule.results.length : 0;
		const severity = getSeverity(rule);

		summary.total += count;
		summary[severity] += count;
		summary.byRule.push({
			id: rule.id,
			name: rule.name,
			category: rule.category,
			severity,
			count,
		});
	}

	return summary;
}

export { SEVERITY_KEYS };
