"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { prepararDevoluciones, publicarDevoluciones } from "../acciones";

export function BotonesDevoluciones(props: {
  eventoId: string;
  preparadas: number;
  publicadas: boolean;
  borradores: number;
  desactualizada: boolean;
}) {
  const { eventoId, preparadas, publicadas, borradores, desactualizada } = props;
  const [ocupado, empezar] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  return (
    <div className="grid gap-3">
      {publicadas&&<p className="font-semibold text-primary">Publicadas. Los estudiantes siguen viendo la versión actual hasta que publiques una actualización.</p>}
      {borradores > 0 && (
        <p className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {borradores} {borradores === 1 ? "evaluación sigue" : "evaluaciones siguen"} en borrador: no entran en la devolución. Pediles a esos evaluadores que toquen Enviar.
        </p>
      )}
      {desactualizada && (
        <p className="rounded-2xl bg-lila-claro px-4 py-2.5 text-sm text-verde-oscuro">
          Hubo cambios en evaluaciones después de preparar. Volvé a preparar antes de publicar.
        </p>
      )}
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
        {preparadas ? "Volver a preparar" : publicadas ? "Preparar nueva publicación" : "Preparar devoluciones"}
      </Button>
      {preparadas > 0 &&
        (confirmar ? (
          <span className="inline-flex flex-wrap items-center gap-2 rounded-2xl bg-lila-claro px-3 py-2 text-sm text-verde-oscuro">
            {publicadas?`Vas a actualizar ${preparadas} devoluciones visibles.`:`Vas a publicar ${preparadas} devoluciones a los estudiantes.`} Las evaluaciones siguen abiertas hasta cerrar el evento.
            <Button
              disabled={ocupado}
              className="min-h-11 rounded-lg"
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
            <Button variant="ghost" className="min-h-11 rounded-lg" onClick={() => setConfirmar(false)}>
              Cancelar
            </Button>
          </span>
        ) : (
          <Button disabled={ocupado || desactualizada} className="h-11 rounded-xl px-5" onClick={() => setConfirmar(true)}>
            {publicadas?"Publicar actualización":"Publicar a los estudiantes"}
          </Button>
        ))}
    </div>
    </div>
  );
}
