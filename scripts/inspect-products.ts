import nextEnv from "@next/env";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

nextEnv.loadEnvConfig(process.cwd());
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

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isVisible: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log(`Found ${products.length} products:\n`);
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
