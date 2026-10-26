import { ImageResponse } from "next/og";

export const alt = "TIM — Tu capacidad, en evidencia.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function manrope(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Manrope:wght@800&text=TuapcidnevE.,")).text();
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Imagen() {
  const fuente = await manrope();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#17483F", display: "flex", alignItems: "center", padding: 80, gap: 72 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, background: "#AA8CFA" }} />
          <div style={{ width: 120, height: 100, borderRadius: 16, background: "#8061EB" }} />
          <div style={{ width: 120, height: 160, borderRadius: 16, background: "#FAF8F4" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", color: "#FAF8F4", fontSize: 104, lineHeight: 1, letterSpacing: -4, fontFamily: "Manrope" }}>
          <span>Tu capacidad,</span>
          <span style={{ color: "#AA8CFA" }}>en evidencia.</span>
        </div>
      </div>
    ),
    { ...size, fonts: fuente ? [{ name: "Manrope", data: fuente, weight: 800 }] : undefined },
  );
}
