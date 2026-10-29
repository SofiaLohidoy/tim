import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { clienteServidor } from "@/lib/supabase/servidor";
import { exigirRol } from "@/lib/sesion";
import { eventoActual } from "@/lib/eventos";
import { estadoDelEvento } from "@/lib/organizador";
import { rubricaDelEvento } from "@/lib/rubrica";
import { dimensionesPara } from "@/lib/devoluciones";
import { Panel, Titulo, Vacio } from "@/components/org/ui";
import { claseInput } from "@/components/org/campos";
import { Button } from "@/components/ui/button";
import { Evaluacion } from "@/components/app/evaluacion";

export const metadata: Metadata = { title: "Carga diferida" };

// Plan B sin wifi: el evaluador anota en la rúbrica impresa y el organizador lo carga después.
// Queda marcada como `carga = 'diferida'` y con quién la cargó.
export default function Pagina({ searchParams }: PageProps<"/organizador/devoluciones/diferida">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-muted" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/organizador/devoluciones/diferida">["searchParams"] }) {
  await exigirRol("organizador", "/organizador/devoluciones/diferida");
  const p = await searchParams;
  const asignacion = typeof p.asignacion === "string" ? p.asignacion : "";
  const persona = typeof p.persona === "string" ? p.persona : "";
  const db = await clienteServidor();
  const evento = await eventoActual(db);
  if (!evento) return <Vacio>Primero creá el evento.</Vacio>;
  const e = await estadoDelEvento(db, evento.id);
  const a = e.asignaciones.find((x) => x.id === asignacion);
  const equipo = a ? e.equipos.find((q) => q.id === a.equipo_id) : undefined;
  const miembros = a ? e.miembros.filter((m) => m.equipo_id === a.equipo_id) : [];
  const rubrica = await rubricaDelEvento(db, evento.rubrica_id);
  const listo = a && equipo && rubrica && (a.rol === "jurado" || miembros.some((m) => m.usuario_id === persona));
  const actual = listo
    ? e.evaluaciones.find(
        (x) => x.evaluador_id === a.evaluador_id && x.equipo_id === a.equipo_id && x.estudiante_id === (a.rol === "mentor" ? persona : null),
      )
    : undefined;
  const fila = actual ? await db.from("evaluaciones").select("respuestas, comentario, estado, actualizado_en").eq("id", actual.id).single() : null;

  return (
    <>
      <Link href="/organizador/devoluciones" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Devoluciones
      </Link>
      <Titulo ojo="Plan B">Carga diferida</Titulo>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Panel titulo="¿De quién es la rúbrica en papel?">
          <form className="grid gap-3">
            <select name="asignacion" defaultValue={asignacion} className={claseInput} aria-label="Evaluador y equipo">
              <option value="">Elegí evaluador y equipo…</option>
              {e.asignaciones.map((x) => (
                <option key={x.id} value={x.id}>
                  {e.persona.get(x.evaluador_id)?.nombre} · {x.rol} · {e.equipos.find((q) => q.id === x.equipo_id)?.nombre}
                </option>
              ))}
            </select>
            {a?.rol === "mentor" && (
              <select name="persona" defaultValue={persona} className={claseInput} aria-label="Persona evaluada">
                <option value="">Elegí la persona…</option>
                {miembros.map((m) => (
                  <option key={m.usuario_id} value={m.usuario_id}>
                    {e.persona.get(m.usuario_id)?.nombre}
                  </option>
                ))}
              </select>
            )}
            <Button type="submit" variant="secondary" className="h-11 justify-self-start rounded-xl px-5">
              Abrir rúbrica
            </Button>
          </form>
        </Panel>
        <div>
          {listo && a && equipo && rubrica ? (
            <Evaluacion
              key={`${asignacion}:${persona}`}
              equipoId={equipo.id}
              rol={a.rol as "mentor" | "jurado"}
              estudianteId={a.rol === "mentor" ? persona : null}
              dimensiones={dimensionesPara(a.rol as "mentor" | "jurado", rubrica.dimensiones)}
              niveles={rubrica.niveles}
              inicial={{
                respuestas: (fila?.data?.respuestas ?? {}) as Record<string, { nivel?: string | null; obs?: string }>,
                comentario: fila?.data?.comentario ?? "",
                estado: (fila?.data?.estado as "borrador" | "enviada" | undefined) ?? null,
                actualizado: fila?.data ? new Date(fila.data.actualizado_en).getTime() : 0,
              }}
              cerrada={evento.estado === "cerrado"}
              despues="/organizador/devoluciones/diferida"
              textoDespues="cargar otra"
              diferidaPara={a.evaluador_id}
            />
          ) : (
            <Vacio>Elegí evaluador, equipo y persona para cargar lo que anotó en papel.</Vacio>
          )}
        </div>
      </div>
    </>
  );
}
