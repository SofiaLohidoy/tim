"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCheck, Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContenidoEinstein, EventoPartida } from "@/lib/actividades/tipos";
import { abandonarPartida, comprobarEinstein, type Final } from "../acciones";

type Asignacion = Record<string, string[]>;

export function JuegoEinstein(p: { partidaId: string; contenido: ContenidoEinstein; eventos: EventoPartida[]; alTerminar: (f: Final) => void }) {
  const c = p.contenido;
  const clave = `tim:einstein:${p.partidaId}`;
  const vacia = (): Asignacion => Object.fromEntries(c.categorias.map((k) => [k.clave, Array<string>(c.sillas).fill("")]));
  const [a, setA] = useState<Asignacion>(vacia);
  const [tachadas, setTachadas] = useState<Set<number>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, empezar] = useTransition();

  useEffect(() => {
    try {
      const g = localStorage.getItem(clave);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restaura desde el almacenamiento del celular
      if (g) setA(JSON.parse(g));
    } catch {}
  }, [clave]);

  // Elegir un valor en una silla lo saca de cualquier otra: cada valor va en una sola silla.
  const poner = (cat: string, silla: number, valor: string) => {
    const fila = a[cat].map((v, i) => (i === silla ? valor : v === valor ? "" : v));
    const nueva = { ...a, [cat]: fila };
    setA(nueva);
    try {
      localStorage.setItem(clave, JSON.stringify(nueva));
    } catch {}
  };

  const comprobar = () =>
    empezar(async () => {
      const r = await comprobarEinstein(p.partidaId, a).catch(() => ({ error: "Sin conexión. Probá de nuevo." }));
      if ("error" in r && r.error) return void toast.error(r.error);
      if (!("errores" in r)) return;
      if (r.final) {
        localStorage.removeItem(clave);
        return void setTimeout(() => p.alTerminar(r.final!), 600);
      }
      setAviso(
        r.errores === 0
          ? `Lo que pusiste está bien. Faltan ${r.incompletas} casilleros.`
          : `${r.errores} ${r.errores === 1 ? "casillero está mal" : "casilleros están mal"}${r.incompletas ? ` y faltan ${r.incompletas}` : ""}. Revisá las pistas.`,
      );
    });

  return (
    <div className="mt-4 grid gap-4">
      <section className="rounded-3xl bg-card p-4 ring-1 ring-border">
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Pistas</p>
        <p className="mt-1 text-xs text-muted-foreground">Tocá una pista para tacharla cuando ya la usaste.</p>
        <ol className="mt-2 grid gap-1.5">
          {c.pistas.map((x, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setTachadas((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                className={cn("text-left text-[15px] leading-snug transition-colors", tachadas.has(i) && "text-muted-foreground line-through")}
              >
                <b className="mr-1 tabular-nums">{i + 1}.</b>
                {x.texto}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(c.sillas, 2)}, minmax(0, 1fr))` }}>
        {Array.from({ length: c.sillas }, (_, s) => (
          <section key={s} className="rounded-2xl bg-card p-3 ring-1 ring-border">
            <p className="font-heading font-bold">Silla {s + 1}</p>
            <p className="text-xs text-muted-foreground">{s === 0 ? "la de la izquierda" : s === c.sillas - 1 ? "la de la derecha" : " "}</p>
            <div className="mt-2 grid gap-1.5">
              {c.categorias.map((cat) => (
                <label key={cat.clave} className="grid gap-0.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">{cat.nombre}</span>
                  <select
                    value={a[cat.clave]?.[s] ?? ""}
                    onChange={(e) => poner(cat.clave, s, e.target.value)}
                    className={cn("h-10 w-full rounded-lg border-0 bg-muted px-2 text-[15px] ring-1 ring-border ring-inset", a[cat.clave]?.[s] && "bg-lila-claro font-semibold text-verde-oscuro")}
                  >
                    <option value="">—</option>
                    {cat.valores.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>

      {aviso && <p role="status" className="rounded-2xl bg-muted px-4 py-2.5 text-center text-sm">{aviso}</p>}

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={comprobar} disabled={ocupado} className="col-span-2 h-12 rounded-xl">
          <CheckCheck className="size-4" /> Comprobar
        </Button>
        <Button variant="ghost" disabled={ocupado} className="h-12 rounded-xl text-muted-foreground" onClick={() => empezar(async () => { const r = await abandonarPartida(p.partidaId); if (r.final) p.alTerminar(r.final); })}>
          <Flag className="size-4" /> Dejar
        </Button>
      </div>
    </div>
  );
}
