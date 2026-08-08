import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma must stay a server-side external in RSC/route handlers.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
