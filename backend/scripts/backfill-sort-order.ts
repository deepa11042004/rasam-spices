/**
 * Backfill sort orders for existing products.
 *
 * For each category, assigns sequential sort orders (1, 2, 3, ...)
 * preserving the current relative ordering (by existing sortOrder, then name).
 *
 * Run with:
 *   node --experimental-strip-types --import ./scripts/ts-loader-register.mjs --env-file=.env scripts/backfill-sort-order.ts
 */

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "127.0.0.1",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: requiredEnv("DATABASE_USER"),
  password: requiredEnv("DATABASE_PASSWORD"),
  database: requiredEnv("DATABASE_NAME"),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Backfilling sort orders per category...\n");

  // Get distinct categories
  const categories = await prisma.product.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  for (const { category } of categories) {
    // Get all products in category, ordered by current sortOrder then name
    const products = await prisma.product.findMany({
      where: { category },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, sortOrder: true },
    });

    console.log(`Category: ${category} (${products.length} products)`);

    for (let i = 0; i < products.length; i++) {
      const newOrder = i + 1;
      const p = products[i];
      if (p.sortOrder !== newOrder) {
        await prisma.product.update({
          where: { id: p.id },
          data: { sortOrder: newOrder },
        });
        console.log(`  ${p.name}: ${p.sortOrder} → ${newOrder}`);
      } else {
        console.log(`  ${p.name}: ${newOrder} (unchanged)`);
      }
    }
    console.log();
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
