import prisma from "../app/db.server.js";

async function main() {
  const shopId = 1;

  const job = await prisma.scanJob.create({
    data: {
      shopId,
      type: "full",
      status: "PENDING",
    },
  });

  console.log("Created scan job:");
  console.log(job);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });