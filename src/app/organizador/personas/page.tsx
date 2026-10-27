import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { estadoDelEvento } from "@/lib/organizador";
import { Panel, Titulo, Vacio } from "@/components/org/ui";
import { AccionesPersona, AsistenciaToggle, BotonBorrar, DeletePersona, FormInvitar, LinkInvitacion } from "./piezas";

export const metadata: Metadata = { title: "Personas" };

const ROL: Record<string, string> = { mentor: "Mentor", jurado: "Jurado", organizador: "Organizador", estudiante: "Estudiante" };

export default function Pagina({searchParams}:PageProps<"/organizador/personas">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({searchParams}:{searchParams:PageProps<"/organizador/personas">["searchParams"]}) {
  const u = await exigirRol("organizador", "/organizador/personas");
  const db = await clienteServidor();
  const valor=(await searchParams).persona;
  let personaId:string|undefined;
  if(valor!==undefined){const v=z.uuid().safeParse(valor);if(!v.success)return <Vacio>El enlace de la persona no es válido.</Vacio>;personaId=v.data;}
  const evento = personaId?null:await eventoActual(db);
  const e = await estadoDelEvento(db, evento?.id ?? null,personaId);

  const presentes = new Set(e.asistencias.map((a) => a.usuario_id));
  const equipoDe = new Map(e.miembros.map((m) => [m.usuario_id, e.equipos.find((q) => q.id === m.equipo_id)?.nombre ?? ""]));
  const staff = e.roles.filter((r) => r.rol !== "estudiante");
  const estudiantes = [...e.estudiantes].sort((a, b) =>
    (e.persona.get(a.usuario_id)?.nombre ?? "").localeCompare(e.persona.get(b.usuario_id)?.nombre ?? "", "es"),
  );

  return (
    <>
      <Titulo ojo={evento?.nombre ?? "Todas las personas"}>Personas</Titulo>
      {personaId&&<a href="/organizador/personas" className="mb-4 inline-flex min-h-11 items-center font-semibold text-violeta-texto">Ver todas las personas</a>}
      <div className="grid gap-4">
        <Panel titulo={`Estudiantes (${estudiantes.length})`} descripcion={evento ? `${presentes.size} presentes. Tildá para marcar asistencia a mano (plan B si falla el QR).` : "Creá un evento para registrar asistencia. Podés administrar las cuentas desde acá."}>
          {estudiantes.length === 0 ? (
            <Vacio>Todavía no se registró nadie.</Vacio>
          ) : (
            <>
            <ul className="grid gap-3 md:hidden" aria-label="Estudiantes">
              {estudiantes.map((s) => {
                const p = e.persona.get(s.usuario_id);
                return <li key={s.usuario_id} className="grid gap-3 rounded-2xl border border-border p-4">
                  <div><p className="font-semibold">{p?.nombre}</p><p className="break-all text-sm text-muted-foreground">{p?.email}</p></div>
                  <p className="text-sm text-muted-foreground">{[s.carrera, s.universidad].filter(Boolean).join(" · ")}</p>
                  <p className="text-sm">{equipoDe.get(s.usuario_id) || "Sin equipo"}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {evento && <span className="inline-flex items-center gap-2 text-sm"><AsistenciaToggle eventoId={evento.id} usuarioId={s.usuario_id} presente={presentes.has(s.usuario_id)} />Presente</span>}
                    <AccionesPersona usuarioId={s.usuario_id} tieneCv={Boolean(s.cv_path)} nombre={p?.nombre ?? ""} />
                    <DeletePersona usuarioId={s.usuario_id} nombre={p?.nombre ?? ""} email={p?.email ?? ""} protegido={s.usuario_id === u.id || e.roles.some((r) => r.usuario_id === s.usuario_id && r.rol !== "estudiante")} />
                  </div>
                </li>;
              })}
            </ul>
            <div className="-mx-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="px-5 py-2 font-semibold">Presente</th>
                    <th className="py-2 font-semibold">Nombre</th>
                    <th className="py-2 font-semibold">Carrera</th>
                    <th className="py-2 font-semibold">Equipo</th>
                    <th className="px-5 py-2 text-right font-semibold">Acciones</th>
                    <th className="px-5 py-2 text-right font-semibold">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((s) => {
                    const p = e.persona.get(s.usuario_id);
                    return (
                      <tr key={s.usuario_id} className="border-b border-border last:border-0">
                        <td className="px-5 py-2">
                          {evento ? <AsistenciaToggle eventoId={evento.id} usuarioId={s.usuario_id} presente={presentes.has(s.usuario_id)} /> : <span className="text-muted-foreground">—</span>}
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
                        <td className="px-5 py-2 text-right">
                          <DeletePersona usuarioId={s.usuario_id} nombre={p?.nombre ?? ""} email={p?.email ?? ""} protegido={s.usuario_id === u.id || e.roles.some((r) => r.usuario_id === s.usuario_id && r.rol !== "estudiante")} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel titulo="Invitar staff" descripcion="Se crea un link personal. Mandáselo a la persona: al abrirlo con ese mail, queda con el rol.">
            <FormInvitar eventoId={evento?.id ?? null} equipos={e.equipos.map((q) => ({ id: q.id, nombre: q.nombre }))} />
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
