import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Ícono de la app al agregarla a la pantalla de inicio: el isotipo sobre verde TIM.
export default function Icono() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#17483F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: "#AA8CFA" }} />
        <div style={{ width: 44, height: 36, borderRadius: 7, background: "#8061EB" }} />
        <div style={{ width: 44, height: 44, borderRadius: 7, background: "#FAF8F4" }} />
      </div>
    ),
    size,
  );
}
