import type { Origen } from "./esquemas";

/** Lee utm_*, `origen` (ej. `qr` en el cartel de la hackatón) y el referrer. Solo navegador. */
export function leerOrigen(): Origen {
  const p = new URLSearchParams(window.location.search);
  const o: Origen = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "origen"] as const) {
    const v = p.get(k);
    if (v) o[k] = v.slice(0, 80);
  }
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) {
    o.referrer = new URL(document.referrer).hostname;
  }
  return o;
}

export function enviarEvento(tipo: string, detalle?: string, origen?: Origen) {
  const cuerpo = JSON.stringify({ tipo, detalle, origen });
  if (navigator.sendBeacon?.("/api/landing", new Blob([cuerpo], { type: "application/json" }))) return;
  void fetch("/api/landing", { method: "POST", body: cuerpo, keepalive: true }).catch(() => {});
}
