import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Next 16 only serves qualities on this list (default [75]). 90 is used for pack photos, the hero
    // collection and the dish photos, which are re-encoded from already-compressed sources.
    qualities: [75, 90],
    remotePatterns: [
      {
        // Admin-uploaded dish images live in Vercel Blob; next/image must be
        // allowed to optimise them. Each store gets its own subdomain.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  serverExternalPackages: [
    "@prisma/adapter-mariadb",
    "@prisma/client",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
