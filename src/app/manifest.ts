import type { MetadataRoute } from "next";

// TIM se puede instalar en el celular como app (fase C: credencial siempre a mano).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TIM — Tu capacidad, en evidencia.",
    short_name: "TIM",
    description: "Desafíos, devoluciones y tu perfil con evidencia de habilidades blandas.",
    start_url: "/continuar",
    scope: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#17483F",
    lang: "es-AR",
    icons: [
      { src: "/iconos/192", sizes: "192x192", type: "image/png" },
      { src: "/iconos/512", sizes: "512x512", type: "image/png" },
      { src: "/iconos/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
