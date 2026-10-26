"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Campo, Mensaje, claseInput } from "@/components/org/campos";
import { cn } from "@/lib/utils";
import { guardarDesafio, guardarEvento, type Resultado } from "../acciones";

type Evento = { id: string; nombre: string; fecha: string; lugar: string | null; estado: string } | null;

export function FormEvento({ evento }: { evento: Evento }) {
  const [r, accion, guardando] = useActionState<Resultado, FormData>(guardarEvento, {});
  return (
    <form action={accion} className="grid gap-4">
      {evento && <input type="hidden" name="id" value={evento.id} />}
      <Campo etiqueta="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" defaultValue={evento?.nombre ?? "Hackatón TIM"} className={claseInput} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Fecha" htmlFor="fecha">
          <input id="fecha" name="fecha" type="date" defaultValue={evento?.fecha ?? "2026-10-31"} className={claseInput} />
        </Campo>
        <Campo etiqueta="Estado" htmlFor="estado" ayuda="“En curso” el día del evento. “Cerrado” cuando termina.">
          <select id="estado" name="estado" defaultValue={evento?.estado ?? "preparacion"} className={claseInput}>
            <option value="preparacion">En preparación</option>
            <option value="en_curso">En curso</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Lugar" htmlFor="lugar" ayuda="Lo ven los estudiantes en su inicio.">
        <input id="lugar" name="lugar" defaultValue={evento?.lugar ?? ""} placeholder="Ej.: UTDT, Sáenz Valiente 1010" className={claseInput} />
      </Campo>
      <Mensaje r={r} />
      <Button type="submit" disabled={guardando} className="h-11 justify-self-start rounded-xl px-5">
        {guardando ? "Guardando…" : evento ? "Guardar cambios" : "Crear el evento"}
      </Button>
    </form>
  );
}

export function FormDesafio({ eventoId, desafio }: { eventoId: string; desafio: { titulo: string; consigna: string; estado: string } | null }) {
  const [r, accion, guardando] = useActionState<Resultado, FormData>(guardarDesafio, {});
  return (
    <form action={accion} className="grid gap-4">
      <input type="hidden" name="eventoId" value={eventoId} />
      <Campo etiqueta="Título" htmlFor="titulo">
        <input id="titulo" name="titulo" defaultValue={desafio?.titulo ?? ""} className={claseInput} />
      </Campo>
      <Campo etiqueta="Consigna" htmlFor="consigna" ayuda="Recordá: un desafío es una evaluación, nunca trabajo productivo gratis.">
        <textarea id="consigna" name="consigna" rows={8} defaultValue={desafio?.consigna ?? ""} className={cn(claseInput, "h-auto py-3")} />
      </Campo>
      <Mensaje r={r} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="estado" value="borrador" variant="secondary" disabled={guardando} className="h-11 rounded-xl px-5">
          Guardar borrador
        </Button>
        <Button type="submit" name="estado" value="publicado" disabled={guardando} className="h-11 rounded-xl px-5">
          {desafio?.estado === "publicado" ? "Guardar (sigue publicado)" : "Publicar a los estudiantes"}
        </Button>
      </div>
    </form>
  );
}
