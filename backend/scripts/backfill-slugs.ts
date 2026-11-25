/**
 * Backfill script: generates URL slugs for all products that have slug = NULL.
 *
 * Safety:
 * - Only updates products whose slug is currently NULL.
 * - Generates slugs from the product NAME, not from numeric IDs.
 * - Handles duplicate names by appending -2, -3, etc.
 * - Does not delete, recreate, or reset any data.
 * - Idempotent: running multiple times is safe.
 */

import { config as dotenvConfig } from "dotenv";

// Load .env, .env.local etc. using Next.js conventions
dotenvConfig();

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
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

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function main() {
  // Get all products that need a slug
  const needsSlugs = await prisma.product.findMany({
    where: { slug: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (needsSlugs.length === 0) {
    console.log("All products already have slugs. Nothing to do.");
    return;
  }

  console.log(`Found ${needsSlugs.length} products without slugs.\n`);

  // Get all existing slugs to avoid conflicts
  const existingSlugs = new Set(
    (await prisma.product.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    })).map((p) => p.slug as string),
  );

  let updated = 0;

  for (const product of needsSlugs) {
    const base = nameToSlug(product.name);
    if (!base) {
      console.warn(`  SKIP ${product.id}: name "${product.name}" produces empty slug`);
      continue;
    }

    let slug = base;
    let suffix = 2;

    while (existingSlugs.has(slug)) {
      slug = `${base}-${suffix}`;
      suffix++;
    }

    // Reserve it immediately
    existingSlugs.add(slug);

    await prisma.product.update({
      where: { id: product.id },
      data: { slug },
    });

    console.log(`  ${product.id} → ${slug}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} products.`);

  // Verify: check for any remaining nulls
  const remaining = await prisma.product.count({ where: { slug: null } });
  if (remaining > 0) {
    console.warn(`\nWARNING: ${remaining} products still have no slug.`);
  } else {
    console.log("All products now have slugs.");
  }

  // Show final state
  const all = await prisma.product.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  console.log("\nFinal product slugs:");
  console.log(JSON.stringify(all, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
