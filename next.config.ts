import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Next output tracing: incluir los PDF privados en las funciones de Vercel.
  // Fuente: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md
  outputFileTracingIncludes: {
    "/hackaton/empresas/*/documento": ["./src/contenidos/hackaton/*.pdf"],
  },
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
