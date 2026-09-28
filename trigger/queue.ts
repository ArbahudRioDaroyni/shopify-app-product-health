import { logger, task, wait } from "@trigger.dev/sdk";

// Definisi tipe data payload input task
type ScanProductsPayload = {
  chunkSize?: number; // Jumlah produk per kelompok (default: 50)
  delayBetweenChunksMs?: number; // Jeda antar chunk dalam milidetik
};

export const scanProductsTask = task({
  id: "scan-products-chunked",
  maxDuration: 1800, // Maksimal 30 menit eksekusi
  run: async (payload: ScanProductsPayload) => {
    const chunkSize = payload.chunkSize ?? 50;
    const delayMs = payload.delayBetweenChunksMs ?? 1000;

    logger.log("Memulai proses scan produk...", { chunkSize, delayMs });

    // 1. Ambil seluruh daftar ID produk yang perlu di-scan dari database
    // (Misal: simulasi 230 produk yang perlu diperiksa)
    const allProductIds = await getAllProductIdsFromDb();
    const totalProducts = allProductIds.length;

    logger.log(`Ditemukan total ${totalProducts} produk untuk diproses.`);

    // 2. Bagi array ID produk menjadi beberapa chunk
    const chunks: string[][] = [];
    for (let i = 0; i < totalProducts; i += chunkSize) {
      chunks.push(allProductIds.slice(i, i + chunkSize));
    }

    logger.log(`Total ${chunks.length} chunk akan diproses.`);

    let processedCount = 0;

    // 3. Loop dan proses setiap chunk satu per satu
    for (let index = 0; index < chunks.length; index++) {
      const currentChunk = chunks[index];

      logger.log(
        `[Chunk ${index + 1}/${chunks.length}] Memproses ${currentChunk.length} produk...`
      );

      // Jalankan logika scan/proses untuk produk di chunk saat ini
      await processProductChunk(currentChunk);

      processedCount += currentChunk.length;

      // Log progress secara berkala
      logger.log(
        `Progress: ${processedCount}/${totalProducts} produk selesai (${Math.round(
          (processedCount / totalProducts) * 100
        )}%)`
      );

      // Beri jeda singkat antar chunk jika masih ada chunk tersisa
      if (index < chunks.length - 1 && delayMs > 0) {
        await wait.for({ seconds: delayMs / 1000 });
      }
    }

    logger.log("Seluruh proses scan produk selesai!", { totalProducts });

    return {
      status: "success",
      totalProcessed: processedCount,
      totalChunks: chunks.length,
    };
  },
});

// --- Fungsi Dummy / Simulasi ---

async function getAllProductIdsFromDb(): Promise<string[]> {
  // Simulasi mengambil 230 ID produk dari database
  return Array.from({ length: 230 }, (_, i) => `prod_${i + 1}`);
}

async function processProductChunk(_productIds: string[]) {
  // Simulasi query batch atau panggil API eksternal untuk memeriksa produk
  // Misal: await db.product.updateMany(...) atau Promise.all(...)
  await new Promise((resolve) => setTimeout(resolve, 300));
}