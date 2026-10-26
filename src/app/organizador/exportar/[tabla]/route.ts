import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/servidor";
import { usuarioActual } from "@/lib/sesion";
import { aCsv } from "@/lib/csv";
import { nombreDe } from "@/lib/eventos";

// Exportes para la tesis. Lee con el cliente del organizador: la RLS decide qué ve.
/** Trae todas las filas de a 1000 (el tope de PostgREST): un export truncado falsearía la tesis. */
async function todas<T>(pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await pagina(desde, desde + 999);
    if (error) throw error;
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) return filas;
  }
}

const TABLAS = ["interesados", "eventos_landing", "estudiantes", "evaluaciones", "devoluciones", "actividades"] as const;
type Tabla = (typeof TABLAS)[number];

export async function GET(_req: Request, ctx: RouteContext<"/organizador/exportar/[tabla]">) {
  const { tabla } = await ctx.params;
  const u = await usuarioActual();
  if (!u?.roles.includes("organizador")) return new NextResponse("Solo para organizadores.", { status: 403 });
  if (!TABLAS.includes(tabla as Tabla)) return new NextResponse("Tabla desconocida.", { status: 404 });

  const db = await clienteServidor();
  let csv = "";

  if (tabla === "interesados") {
    const data = await todas((a, b) => db.from("interesados").select("*").order("creado_en").range(a, b));
    csv = aCsv(
      ["fecha", "audiencia", "email", "datos", "variante", "origen", "utm_source", "utm_campaign", "visitante"],
      data.map((r) => {
        const o = (r.origen ?? {}) as Record<string, string>;
        return [r.creado_en, r.audiencia, r.email, JSON.stringify(r.datos), r.variante, o.origen ?? o.referrer, o.utm_source, o.utm_campaign, r.visitante_id];
      }),
    );
  }

  if (tabla === "eventos_landing") {
    const data = await todas((a, b) => db.from("eventos_landing").select("*").order("id").range(a, b));
    csv = aCsv(
      ["fecha", "visitante", "tipo", "detalle", "variante", "origen"],
      data.map((r) => [r.creado_en, r.visitante_id, r.tipo, r.detalle, r.variante, JSON.stringify(r.origen)]),
    );
  }

  if (tabla === "estudiantes") {
    const [est, per, asis, miem, eq] = await Promise.all([
      todas((a, b) => db.from("estudiantes").select("*").order("usuario_id").range(a, b)).then((data) => ({ data })),
      todas((a, b) => db.from("perfiles").select("id, email, nombre, apellido").order("id").range(a, b)).then((data) => ({ data })),
      todas((a, b) => db.from("asistencias").select("usuario_id, evento_id, metodo, creado_en").order("id").range(a, b)).then((data) => ({ data })),
      todas((a, b) => db.from("miembros_equipo").select("usuario_id, equipo_id").order("usuario_id").range(a, b)).then((data) => ({ data })),
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
      todas((a, b) => db.from("evaluaciones").select("*").order("id").range(a, b)).then((data) => ({ data })),
      db.from("dimensiones").select("id, nombre"),
      db.from("niveles").select("id, nombre, orden"),
      todas((a, b) => db.from("perfiles").select("id, email, nombre, apellido").order("id").range(a, b)).then((data) => ({ data })),
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
      todas((a, b) => db.from("devoluciones").select("estudiante_id, evento_id, publicada_en, abierta_en").order("id").range(a, b)).then((data) => ({ data })),
      todas((a, b) => db.from("respuestas_encuesta").select("usuario_id, evento_id, respuestas, creado_en").order("id").range(a, b)).then((data) => ({ data })),
      todas((a, b) => db.from("perfiles").select("id, email").order("id").range(a, b)).then((data) => ({ data })),
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

  if (tabla === "actividades") {
    const [part, sen, enc, per] = await Promise.all([
      todas((a, b) => db.from("partidas").select("id, usuario_id, actividad, version, numero, resultado, eventos, iniciada_en, terminada_en").order("iniciada_en").range(a, b)),
      todas((a, b) => db.from("senales").select("partida_id, clave, valor, regla").order("id").range(a, b)),
      todas((a, b) => db.from("respuestas_encuesta").select("partida_id, respuestas").eq("encuesta", "post_partida").order("id").range(a, b)),
      todas((a, b) => db.from("perfiles").select("id, email").order("id").range(a, b)),
    ]);
    const mail = new Map(per.map((x) => [x.id, x.email]));
    // Una fila por partida, con sus señales en columnas. Las señales son hipótesis (docs/senales.md).
    csv = aCsv(
      ["email", "actividad", "version", "partida_n", "resultado", "segundos", "jugadas", "pistas", "persistencia", "uso_de_informacion", "autocorreccion", "regla", "muestra_como_pienso", "iniciada_en"],
      part.map((p) => {
        const ev = (p.eventos ?? []) as { tipo: string }[];
        const s = sen.filter((x) => x.partida_id === p.id);
        const valor = (c: string) => s.find((x) => x.clave === c)?.valor ?? "";
        const r = enc.find((x) => x.partida_id === p.id)?.respuestas as { muestra_como_pienso?: string } | undefined;
        const seg = p.terminada_en ? Math.round((new Date(p.terminada_en).getTime() - new Date(p.iniciada_en).getTime()) / 1000) : "";
        return [
          mail.get(p.usuario_id), p.actividad, p.version, p.numero, p.resultado, seg,
          ev.filter((e) => e.tipo === "intento" || e.tipo === "comprobar").length, ev.filter((e) => e.tipo === "pista").length,
          valor("persistencia"), valor("uso_de_informacion"), valor("autocorreccion"), s[0]?.regla ?? "", r?.muestra_como_pienso ?? "", p.iniciada_en,
        ];
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
