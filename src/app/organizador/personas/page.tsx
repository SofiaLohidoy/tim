import type { Metadata } from "next";
import { Suspense } from "react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { estadoDelEvento } from "@/lib/organizador";
import { Panel, Titulo, Vacio } from "@/components/org/ui";
import { AccionesPersona, AsistenciaToggle, BotonBorrar, FormInvitar, LinkInvitacion } from "./piezas";

export const metadata: Metadata = { title: "Personas" };

const ROL: Record<string, string> = { mentor: "Mentor", jurado: "Jurado", organizador: "Organizador", estudiante: "Estudiante" };

export default function Pagina() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido />
    </Suspense>
  );
}

async function Contenido() {
  const u = await exigirRol("organizador", "/organizador/personas");
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  const e = evento ? await estadoDelEvento(db, evento.id) : null;
  if (!evento || !e) return <Vacio>Primero creá el evento.</Vacio>;

  const presentes = new Set(e.asistencias.map((a) => a.usuario_id));
  const equipoDe = new Map(e.miembros.map((m) => [m.usuario_id, e.equipos.find((q) => q.id === m.equipo_id)?.nombre ?? ""]));
  const staff = e.roles.filter((r) => r.rol !== "estudiante");
  const estudiantes = [...e.estudiantes].sort((a, b) =>
    (e.persona.get(a.usuario_id)?.nombre ?? "").localeCompare(e.persona.get(b.usuario_id)?.nombre ?? "", "es"),
  );

  return (
    <>
      <Titulo ojo={evento.nombre}>Personas</Titulo>
      <div className="grid gap-4">
        <Panel titulo={`Estudiantes (${estudiantes.length})`} descripcion={`${presentes.size} presentes. Tildá para marcar asistencia a mano (plan B si falla el QR).`}>
          {estudiantes.length === 0 ? (
            <Vacio>Todavía no se registró nadie.</Vacio>
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-2 font-semibold">Presente</th>
                    <th className="py-2 font-semibold">Nombre</th>
                    <th className="py-2 font-semibold">Carrera</th>
                    <th className="py-2 font-semibold">Equipo</th>
                    <th className="px-5 py-2 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((s) => {
                    const p = e.persona.get(s.usuario_id);
                    return (
                      <tr key={s.usuario_id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2">
                          <AsistenciaToggle eventoId={evento.id} usuarioId={s.usuario_id} presente={presentes.has(s.usuario_id)} />
                        </td>
                        <td className="py-2">
                          <span className="font-semibold">{p?.nombre}</span>
                          <span className="block text-xs text-muted-foreground">{p?.email}</span>
                        </td>
                        <td className="py-2 text-muted-foreground">{[s.carrera, s.universidad].filter(Boolean).join(" · ")}</td>
                        <td className="py-2">{equipoDe.get(s.usuario_id) || <span className="text-muted-foreground">—</span>}</td>
                        <td className="px-5 py-2">
                          <AccionesPersona usuarioId={s.usuario_id} tieneCv={Boolean(s.cv_path)} nombre={p?.nombre ?? ""} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel titulo="Invitar staff" descripcion="Se crea un link personal. Mandáselo a la persona: al abrirlo con ese mail, queda con el rol.">
            <FormInvitar eventoId={evento.id} equipos={e.equipos.map((q) => ({ id: q.id, nombre: q.nombre }))} />
          </Panel>

          <Panel titulo="Invitaciones">
            {e.invitaciones.length === 0 ? (
              <Vacio>Sin invitaciones.</Vacio>
            ) : (
              <ul className="grid gap-2">
                {e.invitaciones.map((i) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{i.nombre || i.email}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {ROL[i.rol]}
                        {i.equipo_id && ` · ${e.equipos.find((q) => q.id === i.equipo_id)?.nombre ?? ""}`} · {i.email}
                      </span>
                    </span>
                    {i.usada_en ? (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">Usada</span>
                    ) : (
                      <LinkInvitacion token={i.token} />
                    )}
                    <BotonBorrar tipo="invitacion" id={i.id} etiqueta="Borrar" />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel titulo="Staff con rol" descripcion="Quién puede entrar a cada vista hoy.">
          {staff.length === 0 ? (
            <Vacio>Nadie todavía.</Vacio>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{e.persona.get(r.usuario_id)?.nombre}</span>
                    <span className="block text-xs text-muted-foreground">{ROL[r.rol]}</span>
                  </span>
                  {!(r.usuario_id === u.id && r.rol === "organizador") && <BotonBorrar tipo="rol" id={r.id} etiqueta="Quitar" />}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
