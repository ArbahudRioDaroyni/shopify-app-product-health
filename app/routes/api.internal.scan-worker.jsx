// import { runScanWorker } from "../services/scan/scan-runner.server";

export async function loader({ request }) {
  // const authHeader = request.headers.get("Authorization");

  // if (
  //   authHeader !==
  //   `Bearer ${process.env.SCAN_WORKER_SECRET}`
  // ) {
  //   return new Response("Unauthorized", {
  //     status: 401,
  //   });
  // }

  // const results = await runScanWorker({
  //   maxJobs: 1,
  // });

  const results = [
    {
      id: 1,
      data: 'ok'
    }
  ]

  return Response.json({
    success: true,
    results,
  });
}