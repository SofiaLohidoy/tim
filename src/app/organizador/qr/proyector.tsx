"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marca";
import { rotarCodigo } from "../acciones";

const CADA = 60;

/**
 * Pantalla para proyectar en la entrada. El código cambia cada minuto (el anterior sigue valiendo
 * 3 minutos más, para quien escaneó justo en el cambio). Así una foto del QR mandada por WhatsApp
 * no sirve para marcar asistencia desde la casa.
 */
export function Proyector({ eventoId, eventoNombre }: { eventoId: string; eventoNombre: string }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [svg, setSvg] = useState("");
  const [resta, setResta] = useState(CADA);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    let restante = CADA;
    const ciclo = async () => {
      const r = await rotarCodigo(eventoId).catch(() => ({ error: "Sin conexión.", codigo: undefined }));
      if (!vivo) return;
      if (!r.codigo) {
        setError(r.error ?? "No pudimos rotar el código.");
        restante = 10;
        return;
      }
      setError(null);
      setCodigo(r.codigo);
      restante = CADA;
      setResta(CADA);
      const url = `${window.location.origin}/a/${r.codigo}`;
      const dibujo = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#102E28", light: "#FAF8F4" } });
      if (vivo) setSvg(dibujo);
    };
    const primero = setTimeout(ciclo, 0);
    const reloj = setInterval(() => {
      restante -= 1;
      setResta(Math.max(restante, 0));
      if (restante === 0) void ciclo();
    }, 1000);
    let bloqueo: WakeLockSentinel | null = null;
    navigator.wakeLock?.request("screen").then((b) => (bloqueo = b)).catch(() => {});
    return () => {
      vivo = false;
      clearTimeout(primero);
      clearInterval(reloj);
      void bloqueo?.release();
    };
  }, [eventoId]);

  return (
    <div ref={ref} className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 rounded-3xl bg-primary p-8 text-primary-foreground">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Pantalla completa"
        className="absolute top-4 right-4 text-primary-foreground hover:bg-white/10"
        onClick={() => void ref.current?.requestFullscreen?.().catch(() => {})}
      >
        <Maximize2 className="size-5" />
      </Button>
      <Logo className="h-10 w-auto" />
      <p className="text-center font-heading text-[clamp(1.5rem,3.5vw,2.75rem)] font-extrabold">Escaneá y marcá que estás acá</p>
      <div
        className="aspect-square w-[min(60vh,80vw)] overflow-hidden rounded-3xl p-4 [&_svg]:size-full"
        style={{ background: "#FAF8F4" }}
        dangerouslySetInnerHTML={{ __html: svg }}
        aria-label={codigo ? `Código QR para marcar asistencia. Código ${codigo}` : "Generando código"}
        role="img"
      />
      <div className="text-center">
        <p className="text-primary-foreground/70">¿No te abre la cámara? Entrá a TIM y escribí</p>
        <p className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold tracking-[0.18em] tabular-nums">{codigo ?? "······"}</p>
      </div>
      <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/15">
        <div className="h-full origin-left rounded-full bg-lila transition-transform duration-1000 ease-linear" style={{ transform: `scaleX(${resta / CADA})` }} />
      </div>
      <p className="text-sm text-primary-foreground/60">{eventoNombre} · cambia en {resta} s</p>
      {error && <p className="rounded-xl bg-destructive px-3 py-2 text-sm text-white">{error} Reintentamos solos.</p>}
    </div>
  );
}
