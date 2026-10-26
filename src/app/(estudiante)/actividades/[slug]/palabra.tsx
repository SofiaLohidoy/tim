"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Delete, Lightbulb, Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContenidoPalabra, EventoPartida, Marca } from "@/lib/actividades/tipos";
import { abandonarPartida, jugarPalabra, pistaPalabra, type Final } from "../acciones";

const FILAS = ["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"];
const PESO: Record<Marca, number> = { no: 0, esta: 1, ok: 2 };
const COLOR: Record<Marca, string> = {
  ok: "bg-primary text-primary-foreground ring-primary",
  esta: "bg-lila text-verde-oscuro ring-lila",
  no: "bg-muted-foreground/25 text-foreground/60 ring-transparent",
};

type Intento = { palabra: string; marcas: Marca[] };

export function JuegoPalabra(p: { partidaId: string; contenido: ContenidoPalabra; eventos: EventoPartida[]; alTerminar: (f: Final) => void }) {
  const [intentos, setIntentos] = useState<Intento[]>(() =>
    p.eventos.flatMap((e) => (e.tipo === "intento" ? [{ palabra: e.palabra, marcas: e.marcas }] : [])),
  );
  const [actual, setActual] = useState("");
  const [pista, setPista] = useState<{ posicion: number; letra: string } | null>(null);
  const [pistasUsadas, setPistasUsadas] = useState(p.eventos.filter((e) => e.tipo === "pista").length);
  const [sacude, setSacude] = useState(false);
  const [ocupado, empezar] = useTransition();

  const teclas = new Map<string, Marca>();
  for (const i of intentos) [...i.palabra].forEach((l, k) => {
    const m = i.marcas[k];
    if (!teclas.has(l) || PESO[m] > PESO[teclas.get(l)!]) teclas.set(l, m);
  });

  const enviar = useCallback(() => {
    if (actual.length !== p.contenido.largo) {
      setSacude(true);
      setTimeout(() => setSacude(false), 400);
      return;
    }
    const palabra = actual;
    empezar(async () => {
      const r = await jugarPalabra(p.partidaId, palabra).catch(() => ({ error: "Sin conexión. Probá de nuevo.", marcas: undefined, final: undefined }));
      if (r.error || !r.marcas) return void toast.error(r.error ?? "No pudimos corregir.");
      setIntentos((x) => [...x, { palabra, marcas: r.marcas! }]);
      setActual("");
      if (r.final) setTimeout(() => p.alTerminar(r.final!), 900);
    });
  }, [actual, p, empezar]);

  const tocar = useCallback(
    (t: string) => {
      if (ocupado) return;
      if (t === "ENTER") return enviar();
      if (t === "BORRAR") return setActual((a) => a.slice(0, -1));
      setActual((a) => (a.length < p.contenido.largo ? a + t : a));
    },
    [ocupado, enviar, p.contenido.largo],
  );

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") tocar("ENTER");
      else if (e.key === "Backspace") tocar("BORRAR");
      else if (/^[a-zA-ZñÑ]$/.test(e.key)) tocar(e.key.toUpperCase());
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [tocar]);

  const filas = Array.from({ length: p.contenido.intentos }, (_, i) => intentos[i] ?? (i === intentos.length ? { palabra: actual, marcas: null } : { palabra: "", marcas: null }));

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid justify-center gap-1.5" aria-label="Intentos" role="grid">
        {filas.map((f, i) => (
          <div key={i} role="row" className={cn("grid grid-cols-5 gap-1.5", i === intentos.length && sacude && "animate-[tim-sacudir_0.35s]")}>
            {Array.from({ length: p.contenido.largo }, (_, k) => {
              const letra = f.palabra[k] ?? (i === intentos.length && pista?.posicion === k ? "" : "");
              const marca = f.marcas?.[k];
              return (
                <span
                  key={k}
                  role="gridcell"
                  aria-label={marca ? `${letra}, ${marca === "ok" ? "en su lugar" : marca === "esta" ? "en otro lugar" : "no está"}` : letra || "vacío"}
                  className={cn(
                    "grid size-[min(16vw,3.6rem)] place-items-center rounded-xl font-heading text-2xl font-extrabold ring-2 ring-inset transition-[background-color,transform] duration-300",
                    marca ? COLOR[marca] : letra ? "bg-card ring-foreground/40" : "bg-card ring-border",
                  )}
                >
                  {letra}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {pista && (
        <p className="rounded-2xl bg-lila-claro px-4 py-2.5 text-center text-sm text-verde-oscuro">
          Pista: la letra {pista.posicion + 1} es <b>{pista.letra}</b>.
        </p>
      )}

      <div className="grid gap-1.5" aria-label="Teclado">
        {FILAS.map((fila, i) => (
          <div key={fila} className="flex justify-center gap-1">
            {i === 2 && <Tecla ancho onClick={() => tocar("ENTER")} etiqueta="Enviar">Enviar</Tecla>}
            {[...fila].map((t) => (
              <Tecla key={t} onClick={() => tocar(t)} marca={teclas.get(t)} etiqueta={t}>{t}</Tecla>
            ))}
            {i === 2 && <Tecla ancho onClick={() => tocar("BORRAR")} etiqueta="Borrar"><Delete className="size-5" /></Tecla>}
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-2">
        <Button
          variant="ghost"
          disabled={ocupado || pistasUsadas >= p.contenido.pistas}
          onClick={() =>
            empezar(async () => {
              const r = await pistaPalabra(p.partidaId);
              if (r.error || r.posicion === undefined) return void toast.error(r.error ?? "No hay pista.");
              setPista({ posicion: r.posicion, letra: r.letra! });
              setPistasUsadas((n) => n + 1);
            })
          }
          className="h-11 rounded-xl"
        >
          <Lightbulb className="size-4" /> {pistasUsadas >= p.contenido.pistas ? "Sin pistas" : "Pedir una pista"}
        </Button>
        <Button variant="ghost" disabled={ocupado} onClick={() => empezar(async () => { const r = await abandonarPartida(p.partidaId); if (r.final) p.alTerminar(r.final); })} className="h-11 rounded-xl text-muted-foreground">
          <Flag className="size-4" /> Dejar acá
        </Button>
      </div>
    </div>
  );
}

function Tecla(p: { children: React.ReactNode; onClick: () => void; marca?: Marca; ancho?: boolean; etiqueta: string }) {
  return (
    <button
      type="button"
      onClick={p.onClick}
      aria-label={p.etiqueta}
      className={cn(
        "grid h-13 place-items-center rounded-lg text-[15px] font-semibold ring-1 ring-inset transition-[background-color,transform] duration-150 active:scale-95",
        p.ancho ? "min-w-14 flex-[1.5] px-1.5 text-xs" : "min-w-0 flex-1",
        p.marca ? COLOR[p.marca] : "bg-card ring-border",
      )}
    >
      {p.children}
    </button>
  );
}
