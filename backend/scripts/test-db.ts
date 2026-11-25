import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.$queryRaw<
    Array<{ database_name: string }>
  >`SELECT DATABASE() AS database_name`;

  console.log("Database connection successful!");
  console.log("Connected database:", result[0]?.database_name);
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
