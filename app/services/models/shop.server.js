import db from "../../db.server.js";

/**
 * Mengambil atau membuat record Shop berdasarkan domain Shopify session.
 * Juga menginisialisasi AppSetting secara otomatis jika shop baru dibuat.
 */
export async function getOrCreateShop({domain}) {
  const shopifyDomain = String(domain);

  const shop = await db.shop.upsert({
    where: { shopifyDomain },
    update: {
      isActive: true, // Pastikan aktif jika sebelumnya pernah uninstalled
    },
    create: {
      shopifyDomain,
      name: shopifyDomain.replace(".myshopify.com", ""),
      appSettings: {
        create: {}, // Membuat AppSetting default secara otomatis
      },
    },
    include: {
      appSettings: true,
    },
  });

  return shop;
}

export async function updateShopScanStatus({shopId, status, error = null}) {
  return await db.shop.update({
    where: { id: shopId },
    data: {
      scanStatus: status,
      scanStartedAt: status === "IN_PROGRESS" ? new Date() : undefined,
      lastScanError: error,
    },
  });
}

export async function shouldRunInitialScan(shop) {
  return shop.scanStatus === "IDLE" || shop.scanStatus === "FAILED";
}