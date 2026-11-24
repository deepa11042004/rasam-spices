import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  const count = await prisma.adminUser.count();
  console.log(`Admin accounts: ${count}`);
}

main()
  .catch((err) => {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
