import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai pembersihan data lama (mengabaikan tabel Session)...");

  // Hapus semua tabel selain Session jika tabel tersebut ada
  const tableNames = [
    // "CatalogScan",
    // "ProductHealth",
    // "CatalogIssue",
    // "CollectionHealth",
    "Shop",
    "AppSetting",
    "Product",
    "Variant",
    "Issue",
    "DashboardSnapshot",
    "sqlite_sequence"
  ];

  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
      console.log(`✓ Data tabel ${tableName} berhasil dibersihkan.`);
    } catch (e) {
      // Abaikan error jika tabel belum pernah ada sebelumnya
    }
  }

  console.log("Selesai! Tabel Session tetap aman.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());