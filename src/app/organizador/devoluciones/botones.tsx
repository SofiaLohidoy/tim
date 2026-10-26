"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { prepararDevoluciones, publicarDevoluciones } from "../acciones";

export function BotonesDevoluciones({ eventoId, preparadas, publicadas }: { eventoId: string; preparadas: number; publicadas: boolean }) {
  const [ocupado, empezar] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  if (publicadas) return <p className="font-semibold text-primary">Publicadas. Los estudiantes ya las ven.</p>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={preparadas ? "secondary" : "default"}
        disabled={ocupado}
        className="h-11 rounded-xl px-5"
        onClick={() =>
          empezar(async () => {
            const r = await prepararDevoluciones(eventoId);
            if (r.error) toast.error(r.error);
            else toast.success(r.mensaje);
          })
        }
      >
        {preparadas ? "Volver a preparar" : "Preparar devoluciones"}
      </Button>
      {preparadas > 0 &&
        (confirmar ? (
          <span className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-lila-claro px-3 py-2 text-sm text-verde-oscuro">
            Publicar cierra las evaluaciones: ya no se pueden corregir.
            <Button
              disabled={ocupado}
              className="h-9 rounded-lg"
              onClick={() =>
                empezar(async () => {
                  const r = await publicarDevoluciones(eventoId);
                  if (r.error) toast.error(r.error);
                  else toast.success(r.mensaje);
                  setConfirmar(false);
                })
              }
            >
              Sí, publicar
            </Button>
            <Button variant="ghost" className="h-9 rounded-lg" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
          </span>
        ) : (
          <Button disabled={ocupado} className="h-11 rounded-xl px-5" onClick={() => setConfirmar(true)}>
            Publicar a los estudiantes
          </Button>
        ))}
    </div>
  );
}
