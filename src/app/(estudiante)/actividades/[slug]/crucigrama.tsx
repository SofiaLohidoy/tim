"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CheckCheck, Flag, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContenidoCrucigrama, EventoPartida, Pista } from "@/lib/actividades/tipos";
import { abandonarPartida, comprobarCrucigrama, pistaCrucigrama, type Final } from "../acciones";

type Dir = "h" | "v";

export function JuegoCrucigrama(p: { partidaId: string; contenido: ContenidoCrucigrama; eventos: EventoPartida[]; alTerminar: (f: Final) => void }) {
  const c = p.contenido;
  const clave = `tim:cruci:${p.partidaId}`;
  const negra = useMemo(() => new Set(c.negras.map(([f, k]) => `${f},${k}`)), [c.negras]);
  const vacia = () => Array.from({ length: c.filas }, () => Array<string>(c.columnas).fill(""));
  const [grilla, setGrilla] = useState<string[][]>(vacia);
  const [sel, setSel] = useState<[number, number]>([0, 0]);
  const [dir, setDir] = useState<Dir>("h");
  const [mal, setMal] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [pistas, setPistas] = useState(p.eventos.filter((e) => e.tipo === "pista").length);
  const [ocupado, empezar] = useTransition();
  const entrada = useRef<HTMLInputElement>(null);

  // La grilla en curso se guarda en el celular: si se cierra la pestaña, se retoma.
  useEffect(() => {
    try {
      const g = localStorage.getItem(clave);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura desde el almacenamiento del celular
      if (g) setGrilla(JSON.parse(g));
    } catch {}
  }, [clave]);
  const guardar = (g: string[][]) => {
    setGrilla(g);
    try {
      localStorage.setItem(clave, JSON.stringify(g));
    } catch {}
  };

  const pistaDe = (d: Dir, [f, k]: [number, number]): Pista | undefined =>
    (d === "h" ? c.horizontales : c.verticales).find((x) =>
      d === "h" ? x.fila === f && k >= x.col && k < x.col + x.largo : x.col === k && f >= x.fila && f < x.fila + x.largo,
    );
  const activa = pistaDe(dir, sel) ?? pistaDe(dir === "h" ? "v" : "h", sel);
  const dirActiva: Dir = pistaDe(dir, sel) ? dir : dir === "h" ? "v" : "h";
  const enActiva = (f: number, k: number) =>
    activa && (dirActiva === "h" ? f === activa.fila && k >= activa.col && k < activa.col + activa.largo : k === activa.col && f >= activa.fila && f < activa.fila + activa.largo);
  const numero = (f: number, k: number) => [...c.horizontales, ...c.verticales].find((x) => x.fila === f && x.col === k)?.n;

  const elegir = (f: number, k: number) => {
    if (negra.has(`${f},${k}`)) return;
    if (sel[0] === f && sel[1] === k) setDir((d) => (d === "h" ? "v" : "h"));
    setSel([f, k]);
    entrada.current?.focus();
  };

  const mover = (paso: number) => {
    let [f, k] = sel;
    for (let i = 0; i < c.filas * c.columnas; i++) {
      if (dirActiva === "h") k += paso;
      else f += paso;
      if (f < 0 || k < 0 || f >= c.filas || k >= c.columnas) return;
      if (!negra.has(`${f},${k}`)) return setSel([f, k]);
    }
  };

  const escribir = (letra: string) => {
    const g = grilla.map((x) => [...x]);
    g[sel[0]][sel[1]] = letra;
    setMal((m) => {
      const n = new Set(m);
      n.delete(`${sel[0]},${sel[1]}`);
      return n;
    });
    guardar(g);
    if (letra) mover(1);
  };

  const comprobar = () =>
    empezar(async () => {
      const r = await comprobarCrucigrama(p.partidaId, grilla).catch(() => ({ error: "Sin conexión. Probá de nuevo." }));
      if ("error" in r && r.error) return void toast.error(r.error);
      if (!("errores" in r)) return;
      setMal(new Set((r.mal ?? []).map(([f, k]) => `${f},${k}`)));
      if (r.final) {
        localStorage.removeItem(clave);
        return void setTimeout(() => p.alTerminar(r.final!), 700);
      }
      setAviso(
        r.errores === 0
          ? `Todo bien hasta acá. Faltan ${r.incompletas} casilleros.`
          : `${r.errores} ${r.errores === 1 ? "casillero está mal" : "casilleros están mal"} (marcados).${r.incompletas ? ` Faltan ${r.incompletas}.` : ""}`,
      );
    });

  const ancho = `min(17vw, ${Math.floor(330 / c.columnas)}px)`;

  return (
    <div className="mt-4 grid gap-4">
      <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur">
        <p className="min-h-12 rounded-2xl bg-primary px-4 py-2.5 text-[15px] text-primary-foreground">
          {activa ? (
            <>
              <b className="mr-1.5 text-lila-texto">
                {activa.n} {dirActiva === "h" ? "horizontal" : "vertical"}
              </b>
              {activa.texto}
            </>
          ) : (
            "Tocá un casillero."
          )}
        </p>
      </div>

      <div className="grid justify-center" style={{ gridTemplateColumns: `repeat(${c.columnas}, ${ancho})`, gap: 4 }} role="grid" aria-label="Crucigrama">
        {grilla.flatMap((fila, f) =>
          fila.map((letra, k) => {
            const esNegra = negra.has(`${f},${k}`);
            const n = numero(f, k);
            return (
              <button
                key={`${f},${k}`}
                type="button"
                role="gridcell"
                disabled={esNegra}
                aria-label={esNegra ? "casillero negro" : `fila ${f + 1}, columna ${k + 1}${letra ? `, ${letra}` : ""}`}
                onClick={() => elegir(f, k)}
                style={{ height: ancho }}
                className={cn(
                  "relative grid place-items-center rounded-lg font-heading text-2xl font-extrabold uppercase transition-colors duration-150",
                  esNegra ? "bg-verde-oscuro" : "bg-card ring-1 ring-border ring-inset",
                  !esNegra && enActiva(f, k) && "bg-lila-claro",
                  sel[0] === f && sel[1] === k && "ring-2 ring-violeta",
                  mal.has(`${f},${k}`) && "text-destructive",
                )}
              >
                {n && <span className="absolute top-0.5 left-1 text-[10px] font-semibold text-muted-foreground">{n}</span>}
                {letra}
              </button>
            );
          }),
        )}
      </div>

      <input
        ref={entrada}
        aria-label="Escribir letra"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        className="sr-only"
        value=""
        onChange={(e) => {
          const l = e.target.value.slice(-1).toUpperCase();
          if (/^[A-ZÑÁÉÍÓÚ]$/.test(l)) escribir(l.normalize("NFD").replace(/[̀-ͯ]/g, "") || l);
        }}
        onKeyDown={(e) => {
          if (e.key === "Backspace") {
            e.preventDefault();
            if (grilla[sel[0]][sel[1]]) escribir("");
            else mover(-1);
          } else if (e.key === "ArrowRight") { setDir("h"); mover(1); }
          else if (e.key === "ArrowLeft") { setDir("h"); mover(-1); }
          else if (e.key === "ArrowDown") { setDir("v"); mover(1); }
          else if (e.key === "ArrowUp") { setDir("v"); mover(-1); }
        }}
      />

      {aviso && <p role="status" className="rounded-2xl bg-muted px-4 py-2.5 text-center text-sm">{aviso}</p>}

      <details className="rounded-2xl bg-card px-4 py-3 ring-1 ring-border">
        <summary className="cursor-pointer font-semibold">Todas las pistas</summary>
        <div className="mt-2 grid gap-3 text-sm">
          {(["h", "v"] as const).map((d) => (
            <div key={d}>
              <p className="font-semibold text-muted-foreground">{d === "h" ? "Horizontales" : "Verticales"}</p>
              <ul className="mt-1 grid gap-1">
                {(d === "h" ? c.horizontales : c.verticales).map((x) => (
                  <li key={x.n}>
                    <button type="button" className="text-left" onClick={() => { setDir(d); setSel([x.fila, x.col]); entrada.current?.focus(); }}>
                      <b>{x.n}.</b> {x.texto}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={comprobar} disabled={ocupado} className="col-span-3 h-12 rounded-xl">
          <CheckCheck className="size-4" /> Comprobar
        </Button>
        <Button
          variant="secondary"
          disabled={ocupado || pistas >= c.pistas}
          className="col-span-2 h-11 rounded-xl"
          onClick={() =>
            empezar(async () => {
              const r = await pistaCrucigrama(p.partidaId, grilla);
              if ("error" in r && r.error) return void toast.error(r.error);
              if (!("letra" in r) || r.letra === undefined) return;
              const g = grilla.map((x) => [...x]);
              g[r.fila][r.col] = r.letra;
              guardar(g);
              setPistas((n) => n + 1);
              setSel([r.fila, r.col]);
            })
          }
        >
          <Lightbulb className="size-4" /> {pistas >= c.pistas ? "Sin pistas" : `Revelar una letra (${c.pistas - pistas})`}
        </Button>
        <Button variant="ghost" disabled={ocupado} className="h-11 rounded-xl text-muted-foreground" onClick={() => empezar(async () => { const r = await abandonarPartida(p.partidaId); if (r.final) p.alTerminar(r.final); })}>
          <Flag className="size-4" /> Dejar
        </Button>
      </div>
    </div>
  );
}
