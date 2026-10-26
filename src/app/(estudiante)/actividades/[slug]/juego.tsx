"use client";

import { useState, useTransition } from "react";
import { Clock, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Actividad, EventoPartida } from "@/lib/actividades/tipos";
import { empezarPartida, type Final } from "../acciones";
import { JuegoPalabra } from "./palabra";
import { JuegoCrucigrama } from "./crucigrama";
import { JuegoEinstein } from "./einstein";
import { Resumen } from "./resumen";

const REGLAS: Record<Actividad["tipo"], string> = {
  palabra: "Escribí una palabra de 5 letras. Verde: la letra está en su lugar. Lila: está en otro lugar. Gris: no está.",
  crucigrama: "Tocá un casillero y escribí. Tocalo de nuevo para cambiar entre horizontal y vertical. Comprobá cuando quieras.",
  einstein: "Ubicá a cada persona, su rol y su bebida en una silla. Las pistas alcanzan para una sola respuesta.",
};

export function Juego({ actividad, partida }: { actividad: Actividad; partida: { id: string; eventos: EventoPartida[] } | null }) {
  const [actual, setActual] = useState(partida);
  const [final, setFinal] = useState<{ id: string; f: Final } | null>(null);
  const [ocupado, empezar] = useTransition();

  const nueva = () =>
    empezar(async () => {
      const r = await empezarPartida(actividad.slug);
      if (r.error || !r.id) return void toast.error(r.error ?? "No pudimos empezar.");
      setFinal(null);
      setActual({ id: r.id, eventos: [] });
    });

  const terminar = (f: Final) => {
    if (actual) setFinal({ id: actual.id, f });
    setActual(null);
  };

  return (
    <div className="mt-3">
      <h1 className="text-[1.6rem] leading-tight font-extrabold">{actividad.titulo}</h1>
      {final ? (
        <Resumen partidaId={final.id} final={final.f} alJugarOtra={nueva} ocupado={ocupado} />
      ) : !actual ? (
        <div className="mt-4 grid gap-4">
          <p className="text-muted-foreground">{actividad.descripcion}</p>
          <div className="rounded-3xl bg-card p-5 ring-1 ring-border">
            <p className="text-[15px] leading-relaxed">{REGLAS[actividad.tipo]}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4" /> Unos {actividad.minutos} minutos. No hay apuro: también cuenta cómo lo encarás.
            </p>
          </div>
          <Button onClick={nueva} disabled={ocupado} className="h-13 rounded-2xl text-base font-semibold">
            <Play className="size-4" /> {ocupado ? "Preparando…" : "Empezar"}
          </Button>
        </div>
      ) : actividad.tipo === "palabra" ? (
        <JuegoPalabra key={actual.id} partidaId={actual.id} contenido={actividad.contenido} eventos={actual.eventos} alTerminar={terminar} />
      ) : actividad.tipo === "crucigrama" ? (
        <JuegoCrucigrama key={actual.id} partidaId={actual.id} contenido={actividad.contenido} eventos={actual.eventos} alTerminar={terminar} />
      ) : (
        <JuegoEinstein key={actual.id} partidaId={actual.id} contenido={actividad.contenido} eventos={actual.eventos} alTerminar={terminar} />
      )}
    </div>
  );
}
