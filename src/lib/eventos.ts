import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";

type Db = SupabaseClient<Database>;
export type Evento = Database["public"]["Tables"]["eventos"]["Row"];

/** El evento en curso o el próximo; si todos están cerrados, el último (para ver la devolución). */
export async function eventoActual(db: Db): Promise<Evento | null> {
  const abierto = await db
    .from("eventos")
    .select("*")
    .neq("estado", "cerrado")
    .order("fecha", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (abierto.data) return abierto.data;
  const ultimo = await db.from("eventos").select("*").order("fecha", { ascending: false }).limit(1).maybeSingle();
  return ultimo.data;
}

export function fechaLarga(fecha: string) {
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${fecha}T00:00:00Z`),
  );
}

export function nombreDe(p: { nombre: string | null; apellido: string | null; email?: string | null } | null) {
  if (!p) return "Sin nombre";
  const n = [p.nombre, p.apellido].filter(Boolean).join(" ").trim();
  return n || p.email?.split("@")[0] || "Sin nombre";
}
