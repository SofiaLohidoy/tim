"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marcarAbierta, responderEncuesta } from "../acciones";

const PREGUNTAS = [
  { id: "sirvio", texto: "¿Te sirvió esta devolución?", opciones: [["si", "Sí"], ["mas_o_menos", "Más o menos"], ["no", "No"]] },
  { id: "seguir", texto: "¿Querés seguir sumando evidencia en otros desafíos?", opciones: [["si", "Sí"], ["tal_vez", "Tal vez"], ["no", "No"]] },
  { id: "compartir", texto: "¿La compartirías con una empresa?", opciones: [["si", "Sí"], ["tal_vez", "Tal vez"], ["no", "No"]] },
] as const;

export function MarcarAbierta({ id }: { id: string }) {
  useEffect(() => {
    void marcarAbierta(id);
  }, [id]);
  return null;
}

export function Encuesta({ eventoId }: { eventoId: string }) {
  const [r, setR] = useState<Record<string, string>>({});
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, empezar] = useTransition();

  if (listo) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-lila-claro px-4 py-3 font-medium text-verde-oscuro">
        <Check className="size-5" /> Gracias. Nos ayuda un montón.
      </p>
    );
  }

  return (
    <div className="grid gap-5">
      {PREGUNTAS.map((p) => (
        <fieldset key={p.id}>
          <legend className="font-heading text-[17px] font-bold">{p.texto}</legend>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {p.opciones.map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={r[p.id] === valor}
                onClick={() => setR((x) => ({ ...x, [p.id]: valor }))}
                className={cn(
                  "min-h-11 rounded-xl px-2 text-[15px] ring-1 ring-border transition-[background-color,box-shadow,transform] ring-inset active:scale-[0.97]",
                  r[p.id] === valor ? "bg-lila-claro font-semibold text-verde-oscuro ring-2 ring-violeta" : "bg-card",
                )}
              >
                {texto}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        disabled={enviando || Object.keys(r).length < 3}
        className="h-12 rounded-xl text-base"
        onClick={() =>
          empezar(async () => {
            const res = await responderEncuesta(eventoId, r);
            if (res.error) setError(res.error);
            else setListo(true);
          })
        }
      >
        {enviando ? "Enviando…" : "Enviar respuestas"}
      </Button>
    </div>
  );
}
