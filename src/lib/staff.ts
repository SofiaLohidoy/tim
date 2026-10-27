import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import { nombreDe } from "@/lib/eventos";

type Db = SupabaseClient<Database>;

export type EquipoAsignado = {
  id: string;
  nombre: string;
  eventoId: string;
  eventoNombre: string;
  rubricaId: string | null;
  publicadas: boolean;
  entregaUrl: string | null;
  archivoNombre: string | null;
  miembros: { id: string; nombre: string }[];
};

/** Los equipos que me tocan como mentor o jurado, con sus integrantes. */
export async function equiposAsignados(db: Db, usuarioId: string, rol: "mentor" | "jurado"): Promise<EquipoAsignado[]> {
  const { data } = await db
    .from("asignaciones")
    .select("equipo_id, equipos(id, nombre, entrega_url, evento_id, eventos(nombre, rubrica_id, devoluciones_publicadas_en, estado))")
    .eq("evaluador_id", usuarioId)
    .eq("rol", rol);
  const equipos = (data ?? []).map((a) => a.equipos).filter((e) => e !== null);
  if (equipos.length === 0) return [];
  const archivos = await db.from("entregas_equipo").select("equipo_id,archivo_nombre").in("equipo_id",equipos.map(e=>e.id));

  const { data: miembros } = await db
    .from("miembros_equipo")
    .select("equipo_id, usuario_id, perfiles(nombre, apellido, email)")
    .in("equipo_id", equipos.map((e) => e.id));

  return equipos
    .map((e) => ({
      id: e.id,
      nombre: e.nombre,
      eventoId: e.evento_id,
      eventoNombre: e.eventos?.nombre ?? "",
      rubricaId: e.eventos?.rubrica_id ?? null,
      publicadas: Boolean(e.eventos?.devoluciones_publicadas_en),
      entregaUrl: e.entrega_url,
      archivoNombre: archivos.data?.find(a=>a.equipo_id===e.id)?.archivo_nombre ?? null,
      miembros: (miembros ?? [])
        .filter((m) => m.equipo_id === e.id)
        .map((m) => ({ id: m.usuario_id, nombre: nombreDe(m.perfiles) }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
}

/** Estado de mis evaluaciones por objetivo: clave = estudiante_id o "equipo". */
export async function misEvaluaciones(db: Db, usuarioId: string, equipoIds: string[]) {
  if (equipoIds.length === 0) return new Map<string, Database["public"]["Tables"]["evaluaciones"]["Row"]>();
  const { data } = await db.from("evaluaciones").select("*").eq("evaluador_id", usuarioId).in("equipo_id", equipoIds);
  return new Map((data ?? []).map((e) => [`${e.equipo_id}:${e.estudiante_id ?? "equipo"}`, e]));
}
