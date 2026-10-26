"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { responderPartida, type Final } from "../acciones";

const TITULO = { resuelta: "¡Lo resolviste!", no_resuelta: "Esta vez no salió.", abandonada: "Dejaste la partida." };

export function Resumen({ partidaId, final, alJugarOtra, ocupado }: { partidaId: string; final: Final; alJugarOtra: () => void; ocupado: boolean }) {
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [enviando, empezar] = useTransition();
  const min = Math.floor(final.segundos / 60);
  const seg = final.segundos % 60;

  return (
    <div className="mt-4 grid gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="rounded-3xl bg-primary p-5 text-primary-foreground">
        <p className="font-heading text-2xl font-extrabold">{TITULO[final.resultado]}</p>
        <p className="mt-1 text-primary-foreground/80 tabular-nums">
          {min > 0 ? `${min} min ${seg} s` : `${seg} s`}
          {final.solucion && ` · La palabra era ${final.solucion}.`}
        </p>
      </section>

      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <p className="text-xs font-semibold tracking-[0.14em] text-violeta-texto uppercase">Señales de esta partida</p>
        {final.senales.length === 0 ? (
          <p className="mt-2 text-muted-foreground">Esta partida no dejó señales para mostrar.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {final.senales.map((s) => (
              <li key={s.titulo}>
                <p className="font-semibold">{s.titulo}</p>
                <p className="text-[15px] text-foreground/80">{s.texto}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Una señal describe cómo jugaste esta vez. No es una nota ni una medición: se vuelve útil cuando se repite en varias partidas.
        </p>
      </section>

      <section className="rounded-3xl bg-card p-5 ring-1 ring-border">
        <p className="font-heading text-[17px] font-bold">¿Este juego muestra algo de cómo pensás?</p>
        {respuesta ? (
          <p className="mt-3 flex items-center gap-2 text-primary"><Check className="size-4" /> Gracias.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[["si", "Sí"], ["mas_o_menos", "Más o menos"], ["no", "No"]].map(([v, t]) => (
              <button
                key={v}
                type="button"
                disabled={enviando}
                onClick={() => empezar(async () => { await responderPartida(partidaId, v); setRespuesta(v); })}
                className={cn("min-h-11 rounded-xl bg-background px-2 text-[15px] ring-1 ring-border ring-inset active:scale-[0.97]")}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={alJugarOtra} disabled={ocupado} className="h-12 rounded-xl">Jugar otra vez</Button>
        <Link href="/actividades" className="inline-flex h-12 items-center justify-center rounded-xl bg-secondary font-semibold">Más actividades</Link>
      </div>
    </div>
  );
}
