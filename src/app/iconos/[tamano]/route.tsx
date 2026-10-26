import { ImageResponse } from "next/og";

// Íconos PNG para instalar TIM como app (PWA): el isotipo sobre verde TIM. Android pide 192 y 512.
const TAMANOS = [192, 512];

export async function GET(_req: Request, ctx: RouteContext<"/iconos/[tamano]">) {
  const lado = Number((await ctx.params).tamano);
  if (!TAMANOS.includes(lado)) return new Response("Tamaño no disponible.", { status: 404 });
  const u = lado / 8;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#17483F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: u * 0.35 }}>
        <div style={{ width: u * 1.6, height: u * 1.6, borderRadius: u, background: "#AA8CFA" }} />
        <div style={{ width: u * 1.6, height: u * 1.4, borderRadius: u * 0.25, background: "#8061EB" }} />
        <div style={{ width: u * 1.6, height: u * 1.8, borderRadius: u * 0.25, background: "#FAF8F4" }} />
      </div>
    ),
    { width: lado, height: lado, headers: { "cache-control": "public, max-age=31536000, immutable" } },
  );
}
