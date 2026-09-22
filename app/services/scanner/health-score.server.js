import { summarizeIssues } from "./issue-summary.server.js";

const SEVERITY_PENALTIES = {
	critical: { perIssue: 8, maximum: 45 },
	warning: { perIssue: 3, maximum: 35 },
	improvement: { perIssue: 1, maximum: 15 },
};

export function calculateHealthScore(scanResult = []) {
	const summary = summarizeIssues(scanResult);
	const penalty = Object.entries(SEVERITY_PENALTIES).reduce(
		(total, [severity, config]) => {
			return total + Math.min(summary[severity] * config.perIssue, config.maximum);
		},
		0,
	);

	return Math.max(0, Math.min(100, 100 - penalty));
}
