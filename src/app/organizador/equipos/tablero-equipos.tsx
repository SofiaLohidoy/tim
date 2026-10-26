"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claseInput } from "@/components/org/campos";
import { asignarEvaluador, borrarEquipo, crearEquipos, moverMiembro, quitarAsignacion, renombrarEquipo, type Resultado } from "../acciones";

type Persona = { id: string; nombre: string; email: string };
export type DatosEquipos = {
  eventoId: string;
  equipos: { id: string; nombre: string; miembros: Persona[]; mentor: { asignacion: string; persona: Persona } | null; jurados: { asignacion: string; persona: Persona }[] }[];
  sinEquipo: (Persona & { presente: boolean })[];
  mentores: Persona[];
  jurados: Persona[];
  pendientes: { email: string; rol: string }[];
};

export function TableroEquipos({ d }: { d: DatosEquipos }) {
  const [ocupado, empezar] = useTransition();
  const [cantidad, setCantidad] = useState(8);
  const correr = (f: () => Promise<Resultado>, ok?: string) =>
    empezar(async () => {
      const r = await f();
      if (r.error) toast.error(r.error);
      else if (ok) toast.success(ok);
    });

  return (
    <div className="grid gap-4" aria-busy={ocupado}>
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-card p-4 ring-1 ring-border">
        <label htmlFor="cantidad" className="text-sm font-semibold">Crear</label>
        <input id="cantidad" type="number" min={1} max={40} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} className={`${claseInput} w-20`} />
        <span className="text-sm text-muted-foreground">equipos</span>
        <Button disabled={ocupado} onClick={() => correr(() => crearEquipos(d.eventoId, cantidad), "Equipos creados.")} className="h-11 rounded-xl">
          <Plus className="size-4" /> Crear
        </Button>
        <p className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">
          {d.sinEquipo.length} estudiantes sin equipo · {d.sinEquipo.filter((p) => p.presente).length} presentes
        </p>
      </div>

      {d.pendientes.length > 0 && (
        <p className="rounded-2xl bg-lila-claro px-4 py-3 text-sm text-verde-oscuro">
          {d.pendientes.length} invitaciones de staff todavía sin usar. Para asignarlos acá, tienen que entrar con su link primero (Personas → Staff).
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {d.equipos.map((q) => (
          <article key={q.id} className="grid content-start gap-3 rounded-3xl bg-card p-4 ring-1 ring-border">
            <div className="flex items-center gap-2">
              <input
                defaultValue={q.nombre}
                aria-label="Nombre del equipo"
                onBlur={(e) => e.target.value !== q.nombre && correr(() => renombrarEquipo(q.id, e.target.value))}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-1 font-heading text-lg font-extrabold outline-none focus:bg-muted"
              />
              <span className="text-sm text-muted-foreground tabular-nums">{q.miembros.length}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Borrar ${q.nombre}`}
                disabled={ocupado || q.miembros.length > 0}
                title={q.miembros.length > 0 ? "Sacá a los integrantes antes de borrar" : undefined}
                onClick={() => correr(() => borrarEquipo(q.id), "Equipo borrado.")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Mentor</span>
              <select
                className={claseInput}
                value={q.mentor?.persona.id ?? ""}
                onChange={(e) =>
                  e.target.value
                    ? correr(() => asignarEvaluador(d.eventoId, q.id, "mentor", e.target.value))
                    : q.mentor && correr(() => quitarAsignacion(q.mentor!.asignacion))
                }
              >
                <option value="">Sin mentor</option>
                {d.mentores.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Jurado</span>
              <div className="flex flex-wrap gap-1.5">
                {q.jurados.map((j) => (
                  <span key={j.asignacion} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-3 text-sm">
                    {j.persona.nombre}
                    <button type="button" aria-label={`Quitar a ${j.persona.nombre}`} onClick={() => correr(() => quitarAsignacion(j.asignacion))} className="grid size-6 place-items-center rounded-full hover:bg-background">
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <select className={claseInput} value="" onChange={(e) => e.target.value && correr(() => asignarEvaluador(d.eventoId, q.id, "jurado", e.target.value))}>
                <option value="">Sumar jurado…</option>
                {d.jurados.filter((j) => !q.jurados.some((x) => x.persona.id === j.id)).map((j) => (
                  <option key={j.id} value={j.id}>{j.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Integrantes</span>
              <ul className="grid gap-1">
                {q.miembros.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-xl bg-muted py-1.5 pr-1 pl-3 text-sm">
                    <span className="min-w-0 flex-1 truncate">{m.nombre}</span>
                    <button type="button" aria-label={`Sacar a ${m.nombre}`} onClick={() => correr(() => moverMiembro(d.eventoId, m.id, null))} className="grid size-7 place-items-center rounded-lg hover:bg-background">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <select className={claseInput} value="" onChange={(e) => e.target.value && correr(() => moverMiembro(d.eventoId, e.target.value, q.id))}>
                <option value="">Sumar estudiante…</option>
                {d.sinEquipo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.presente ? "● " : ""}
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
