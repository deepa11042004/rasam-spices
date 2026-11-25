/**
 * Idempotent seed script: imports all products from src/data/products.ts
 * into the MySQL database via Prisma.
 *
 * Safety guarantees:
 * - Uses findUnique before create: only inserts products that don't already
 *   exist in the database. Existing records are never overwritten.
 * - Running this script multiple times will not create duplicates.
 * - Existing database records (including Admin-created products) are preserved.
 * - No schema changes, no destructive operations.
 *
 * Field mapping (static Product → Prisma Product):
 *
 *   Static field          →  Prisma column         Notes
 *   ─────────────────────────────────────────────────────────────────────
 *   id                    →  id                    Primary key, preserved as-is
 *   name                  →  name
 *   category              →  category              CategoryId string
 *   description           →  description
 *   tagline               →  tagline
 *   image?.src            →  imageSrc              Nested object → flat column
 *   image?.alt            →  imageAlt              Nested object → flat column
 *   backImage?.src        →  backImageSrc          Nested object → flat column
 *   backImage?.alt        →  backImageAlt          Nested object → flat column
 *   packSizes             →  packSizes             string[] → JSON column
 *   packFormat            →  packFormat             "Box" | "Pouch" | undefined
 *   pendingNote           →  pendingNote
 *   featured              →  isFeatured            Renamed boolean
 *   (not in static)       →  isVisible             Defaults to true
 *   (not in static)       →  sortOrder             Set to array index for ordering
 *   dishPhoto.src         →  dishPhotoSrc          From productDishPhotos lookup
 *   dishPhoto.alt         →  dishPhotoAlt          From productDishPhotos lookup
 *   dishPhoto.focus       →  dishPhotoFocus        From productDishPhotos lookup
 *   dishPhoto.zoom        →  dishPhotoZoom         From productDishPhotos lookup
 *
 * Run with: npx tsx scripts/seed-products.ts
 */
import { config as dotenvConfig } from "dotenv";

// Load .env, .env.local etc. using Next.js conventions (reads from project root)
dotenvConfig();

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { products } from "../../frontend/src/data/products";
import { productDishPhotos } from "../../frontend/src/data/productDishPhotos";

async function main() {
  // Validate required env vars before connecting
  const requiredVars = ["DATABASE_USER", "DATABASE_PASSWORD", "DATABASE_NAME"] as const;
  for (const name of requiredVars) {
    if (!process.env[name]) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
  }

  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST ?? "127.0.0.1",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
    connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`Seeding ${products.length} products from src/data/products.ts…\n`);

    let created = 0;
    let skipped = 0;

    for (let i = 0; i < products.length; i++) {
      const p = products[i];

      // Check if this product already exists in the database
      const existing = await prisma.product.findUnique({ where: { id: p.id } });

      if (existing) {
        console.log(`  SKIP  ${p.id} (already in database)`);
        skipped++;
        continue;
      }

      // Look up the dish photo for this product (from productDishPhotos.ts)
      const dishPhoto = productDishPhotos[p.id];

      // Create the product — only when it doesn't already exist
      await prisma.product.create({
        data: {
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description ?? null,
          tagline: p.tagline ?? null,

          // Nested image objects → flat columns
          imageSrc: p.image?.src ?? null,
          imageAlt: p.image?.alt ?? null,
          backImageSrc: p.backImage?.src ?? null,
          backImageAlt: p.backImage?.alt ?? null,

          // Pack info
          packSizes: p.packSizes ?? undefined,
          packFormat: p.packFormat ?? null,
          pendingNote: p.pendingNote ?? null,

          // Visibility & featured
          isVisible: true,
          isFeatured: p.featured ?? false,

          // Preserve display order from the static array
          sortOrder: i,

          // Dish photo fields (from productDishPhotos.ts lookup)
          dishPhotoSrc: dishPhoto?.src ?? null,
          dishPhotoAlt: dishPhoto?.alt ?? null,
          dishPhotoFocus: dishPhoto?.focus ?? null,
          dishPhotoZoom: dishPhoto?.zoom ?? null,
        },
      });
      console.log(`  ADD   ${p.id}`);
      created++;
    }

    console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Total in static file: ${products.length}`);

    // Report final database state
    const dbCount = await prisma.product.count();
    console.log(`Total products now in database: ${dbCount}`);
  } finally {
    // Always disconnect, even if seeding fails partway through
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
