import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { estadoDelEvento, type Persona } from "@/lib/organizador";
import { Titulo, Vacio } from "@/components/org/ui";
import { TableroEquipos } from "./tablero-equipos";

export const metadata: Metadata = { title: "Equipos" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  await exigirRol("organizador", "/organizador/equipos");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) return <Vacio>Primero creá el evento.</Vacio>;
  const e = await estadoDelEvento(db, evento.id);
  const p = (id: string): Persona => e.persona.get(id) ?? { id, email: "", nombre: "Sin nombre" };
  const enEquipo = new Set(e.miembros.map((m) => m.usuario_id));
  const presentes = new Set(e.asistencias.map((a) => a.usuario_id));
  const conRol = (rol: string) =>
    [...new Set(e.roles.filter((r) => r.rol === rol).map((r) => r.usuario_id))].map(p).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <>
      <Titulo ojo={evento.nombre}>Equipos</Titulo>
      <TableroEquipos
        d={{
          eventoId: evento.id,
          equipos: e.equipos.map((q) => {
            const mentor = e.asignaciones.find((a) => a.equipo_id === q.id && a.rol === "mentor");
            return {
              id: q.id,
              nombre: q.nombre,
              entregaUrl: q.entrega_url,
              miembros: e.miembros.filter((m) => m.equipo_id === q.id).map((m) => p(m.usuario_id)),
              mentor: mentor ? { asignacion: mentor.id, persona: p(mentor.evaluador_id) } : null,
              jurados: e.asignaciones.filter((a) => a.equipo_id === q.id && a.rol === "jurado").map((a) => ({ asignacion: a.id, persona: p(a.evaluador_id) })),
            };
          }),
          sinEquipo: e.estudiantes
            .filter((s) => !enEquipo.has(s.usuario_id))
            .map((s) => ({ ...p(s.usuario_id), presente: presentes.has(s.usuario_id) }))
            .sort((a, b) => Number(b.presente) - Number(a.presente) || a.nombre.localeCompare(b.nombre, "es")),
          mentores: conRol("mentor"),
          jurados: conRol("jurado"),
          pendientes: e.invitaciones.filter((i) => !i.usada_en && (i.rol === "mentor" || i.rol === "jurado")).map((i) => ({ email: i.email, rol: i.rol })),
        }}
      />
    </>
  );
}
