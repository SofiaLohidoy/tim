import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";
import { usuarioActual } from "@/lib/sesion";
import { aCsv } from "@/lib/csv";
import { nombreDe } from "@/lib/eventos";

// Exportes para la tesis. Lee con el cliente del organizador: la RLS decide qué ve.
const TABLAS = ["interesados", "eventos_landing", "estudiantes", "evaluaciones", "devoluciones"] as const;
type Tabla = (typeof TABLAS)[number];

export async function GET(_req: Request, ctx: RouteContext<"/organizador/exportar/[tabla]">) {
  const { tabla } = await ctx.params;
  const u = await usuarioActual();
  if (!u?.roles.includes("organizador")) return new NextResponse("Solo para organizadores.", { status: 403 });
  if (!TABLAS.includes(tabla as Tabla)) return new NextResponse("Tabla desconocida.", { status: 404 });

  const db = await clienteServidor();
  let csv = "";

  if (tabla === "interesados") {
    const { data } = await db.from("interesados").select("*").order("creado_en");
    csv = aCsv(
      ["fecha", "audiencia", "email", "datos", "variante", "origen", "utm_source", "utm_campaign", "visitante"],
      (data ?? []).map((r) => {
        const o = (r.origen ?? {}) as Record<string, string>;
        return [r.creado_en, r.audiencia, r.email, JSON.stringify(r.datos), r.variante, o.origen ?? o.referrer, o.utm_source, o.utm_campaign, r.visitante_id];
      }),
    );
  }

  if (tabla === "eventos_landing") {
    const { data } = await db.from("eventos_landing").select("*").order("creado_en").limit(100_000);
    csv = aCsv(
      ["fecha", "visitante", "tipo", "detalle", "variante", "origen"],
      (data ?? []).map((r) => [r.creado_en, r.visitante_id, r.tipo, r.detalle, r.variante, JSON.stringify(r.origen)]),
    );
  }

  if (tabla === "estudiantes") {
    const [est, per, asis, miem, eq] = await Promise.all([
      db.from("estudiantes").select("*"),
      db.from("perfiles").select("id, email, nombre, apellido"),
      db.from("asistencias").select("usuario_id, evento_id, metodo, creado_en"),
      db.from("miembros_equipo").select("usuario_id, equipo_id"),
      db.from("equipos").select("id, nombre"),
    ]);
    const p = new Map((per.data ?? []).map((x) => [x.id, x]));
    const equipo = new Map((eq.data ?? []).map((x) => [x.id, x.nombre]));
    csv = aCsv(
      ["email", "nombre", "universidad", "carrera", "anio", "areas", "por_que", "arquetipo", "tiene_cv", "asistio", "metodo_asistencia", "equipo", "registro"],
      (est.data ?? []).map((s) => {
        const a = (asis.data ?? []).find((x) => x.usuario_id === s.usuario_id);
        const m = (miem.data ?? []).find((x) => x.usuario_id === s.usuario_id);
        return [
          p.get(s.usuario_id)?.email, nombreDe(p.get(s.usuario_id) ?? null), s.universidad, s.carrera, s.anio_carrera,
          s.intereses.join(" | "), s.por_que, s.arquetipo, Boolean(s.cv_path), Boolean(a), a?.metodo, m ? equipo.get(m.equipo_id) : "", s.creado_en,
        ];
      }),
    );
  }

  if (tabla === "evaluaciones") {
    const [ev, dims, niv, per, eq] = await Promise.all([
      db.from("evaluaciones").select("*"),
      db.from("dimensiones").select("id, nombre"),
      db.from("niveles").select("id, nombre, orden"),
      db.from("perfiles").select("id, email, nombre, apellido"),
      db.from("equipos").select("id, nombre"),
    ]);
    const dim = new Map((dims.data ?? []).map((d) => [d.id, d.nombre]));
    const nivel = new Map((niv.data ?? []).map((n) => [n.id, n]));
    const p = new Map((per.data ?? []).map((x) => [x.id, x]));
    const equipo = new Map((eq.data ?? []).map((x) => [x.id, x.nombre]));
    // Una fila por evaluación y dimensión: así se pivotea fácil en una planilla.
    const filas = (ev.data ?? []).flatMap((e) =>
      Object.entries((e.respuestas ?? {}) as Record<string, { nivel?: string | null; obs?: string }>).map(([d, r]) => [
        e.id, equipo.get(e.equipo_id), e.rol_evaluador, nombreDe(p.get(e.evaluador_id) ?? null), e.objetivo,
        e.estudiante_id ? p.get(e.estudiante_id)?.email : "", dim.get(d), r.nivel ? nivel.get(r.nivel)?.orden : "",
        r.nivel ? nivel.get(r.nivel)?.nombre : "", r.obs, e.estado, e.carga, e.enviada_en,
      ]),
    );
    csv = aCsv(
      ["evaluacion", "equipo", "rol", "evaluador", "objetivo", "estudiante_email", "dimension", "nivel_orden", "nivel", "observacion", "estado", "carga", "enviada_en"],
      filas,
    );
  }

  if (tabla === "devoluciones") {
    const [dev, enc, per] = await Promise.all([
      db.from("devoluciones").select("estudiante_id, evento_id, publicada_en, abierta_en"),
      db.from("respuestas_encuesta").select("usuario_id, evento_id, respuestas, creado_en"),
      db.from("perfiles").select("id, email"),
    ]);
    const mail = new Map((per.data ?? []).map((x) => [x.id, x.email]));
    csv = aCsv(
      ["estudiante_email", "publicada_en", "abierta_en", "te_sirvio", "seguir_sumando", "compartiria", "respondio_en"],
      (dev.data ?? []).map((d) => {
        const r = (enc.data ?? []).find((x) => x.usuario_id === d.estudiante_id && x.evento_id === d.evento_id);
        const v = (r?.respuestas ?? {}) as Record<string, string>;
        return [mail.get(d.estudiante_id), d.publicada_en, d.abierta_en, v.sirvio, v.seguir, v.compartir, r?.creado_en];
      }),
    );
  }

  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tim-${tabla}-${fecha}.csv"`,
      "cache-control": "no-store",
    },
  });
}
