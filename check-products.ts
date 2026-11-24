import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  const rows = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      isVisible: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  console.table(rows);
  console.log(`Total database products: ${rows.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
