import { runScanWorker } from "../app/services/scan/scan-runner.server.js";
const RUN = true;
const MAX_WORKER = 1;

async function main() {
	console.log("[scan-worker] Started");

	while (RUN) {
		const results = await runScanWorker({
			maxJobs: MAX_WORKER,
		});
		console.log(results);

		const processed = results.some(
			(result) => result.processed
		);
		console.log(processed);

		if (!processed) {
			console.log('sleep 1s');
			await sleep(1000);
		}
	}
}

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function getData() {
  try {
    const response = await fetch('https://lorem-api.com/api/user/1');
    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

getData();

// main()
// 	.catch((error) => {
// 		console.error("[scan-worker] Fatal error:", error);
// 		console.error(error);
// 		process.exit(1);
// 	});