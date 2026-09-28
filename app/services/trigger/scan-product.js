import { scanProductsTask } from "../../../trigger/queue.ts"

export async function triggerProductScan() {
  // Memicu task dengan memproses 50 produk per chunk
  const handle = await scanProductsTask.trigger({
    chunkSize: 50,
    delayBetweenChunksMs: 2000, // Jeda 2 detik antar chunk
  });

  console.log("Scan task berhasil dijadwalkan dengan Run ID:", handle.id);
  return { runId: handle.id };
}