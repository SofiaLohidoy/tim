import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/organizador", "/mentor", "/jurado", "/inicio", "/devolucion", "/perfil", "/bienvenida", "/l/", "/api/"] },
  };
}
