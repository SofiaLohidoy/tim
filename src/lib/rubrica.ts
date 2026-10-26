import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import type { Dimension, Nivel } from "@/lib/devoluciones";

type Db = SupabaseClient<Database>;
export type Rubrica = { id: string; nombre: string; dimensiones: (Dimension & { que_observar: string })[]; niveles: (Nivel & { descripcion: string })[] };

/** La rúbrica del evento; si el evento no eligió una, la plantilla del Anexo 6. */
export async function rubricaDelEvento(db: Db, rubricaId: string | null): Promise<Rubrica | null> {
  const r = rubricaId
    ? await db.from("rubricas").select("id, nombre").eq("id", rubricaId).maybeSingle()
    : await db.from("rubricas").select("id, nombre").eq("es_plantilla", true).order("creado_en").limit(1).maybeSingle();
  if (!r.data) return null;
  const [dims, niveles] = await Promise.all([
    db.from("dimensiones").select("id, orden, nombre, que_observar, instancia").eq("rubrica_id", r.data.id).order("orden"),
    db.from("niveles").select("id, orden, nombre, descripcion").eq("rubrica_id", r.data.id).order("orden"),
  ]);
  return {
    id: r.data.id,
    nombre: r.data.nombre,
    dimensiones: (dims.data ?? []) as Rubrica["dimensiones"],
    niveles: niveles.data ?? [],
  };
}
