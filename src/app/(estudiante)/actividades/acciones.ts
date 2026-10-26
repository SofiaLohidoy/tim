"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirUsuario } from "@/lib/sesion";
import { clienteServicio } from "@/lib/supabase/servicio";
import { actividad } from "@/lib/actividades/catalogo";
import { CRUCIGRAMAS, EINSTEIN, PALABRAS } from "@/lib/actividades/soluciones";
import { marcar, normalizar, valida } from "@/lib/actividades/palabra";
import { corregir as corregirCrucigrama } from "@/lib/actividades/crucigrama";
import { corregir as corregirEinstein } from "@/lib/actividades/einstein";
import { REGLA, describir, senalesDe } from "@/lib/actividades/senales";
import type { ContenidoCrucigrama, ContenidoEinstein, ContenidoPalabra, EventoPartida, Marca } from "@/lib/actividades/tipos";
import type { Json } from "@/lib/supabase/tipos";

// Toda jugada pasa por acá: el servidor tiene la solución, corrige y anota el evento. Escribe con
// service_role (partidas no tiene policy de escritura), siempre después de comprobar que la
// partida es de quien juega y que sigue en curso.

type Partida = {
  id: string;
  usuario_id: string;
  actividad: string;
  version: number;
  tipo: "palabra" | "crucigrama" | "einstein";
  objetivo: { indice?: number } | null;
  resultado: string;
  eventos: EventoPartida[];
  iniciada_en: string;
};

export type Final = {
  resultado: "resuelta" | "no_resuelta" | "abandonada";
  segundos: number;
  senales: { titulo: string; texto: string }[];
  solucion?: string;
};

async function partidaPropia(id: string): Promise<{ db: ReturnType<typeof clienteServicio>; p: Partida; usuario: string }> {
  const u = await exigirUsuario();
  if (!z.uuid().safeParse(id).success) throw new Error("partida_invalida");
  const db = clienteServicio();
  const { data } = await db.from("partidas").select("*").eq("id", id).eq("usuario_id", u.id).maybeSingle();
  if (!data) throw new Error("partida_inexistente");
  if (actividad(data.actividad)?.proximamente) throw new Error("Esta actividad estará disponible próximamente.");
  return { db, p: data as unknown as Partida, usuario: u.id };
}

const momento = (p: Partida) => Date.now() - new Date(p.iniciada_en).getTime();

async function anotar(db: ReturnType<typeof clienteServicio>, p: Partida, evento: EventoPartida) {
  p.eventos = [...p.eventos, evento];
  const { error } = await db.from("partidas").update({ eventos: p.eventos }).eq("id", p.id).eq("resultado", "en_curso");
  if (error) throw new Error("no_se_guardo");
}

async function finalizar(db: ReturnType<typeof clienteServicio>, p: Partida, resultado: Final["resultado"]): Promise<Final> {
  const t = momento(p);
  const eventos: EventoPartida[] =
    resultado === "abandonada" ? [...p.eventos, { t, tipo: "abandono" }] : [...p.eventos, { t, tipo: "fin", resultado }];
  await db.from("partidas").update({ eventos, resultado, terminada_en: new Date().toISOString() }).eq("id", p.id).eq("resultado", "en_curso");
  const senales = senalesDe(p.tipo, eventos, resultado);
  if (senales.length) {
    await db.from("senales").upsert(
      senales.map((s) => ({ partida_id: p.id, usuario_id: p.usuario_id, clave: s.clave, valor: s.valor, detalle: s.detalle as Json, regla: REGLA })),
      { onConflict: "partida_id,clave" },
    );
  }
  revalidatePath("/actividades");
  return { resultado, segundos: Math.round(t / 1000), senales: senales.map(describir) };
}

export async function empezarPartida(slug: string): Promise<{ id?: string; error?: string }> {
  const u = await exigirUsuario();
  const a = actividad(slug);
  if (!a) return { error: "Esa actividad no existe." };
  if (a.proximamente) return { error: "Esta actividad estará disponible próximamente." };
  const db = clienteServicio();
  const previas = await db.from("partidas").select("id", { count: "exact", head: true }).eq("usuario_id", u.id).eq("actividad", slug);
  // Una partida en curso de esta misma actividad se da por abandonada: se empieza de nuevo.
  const enCurso = await db.from("partidas").select("*").eq("usuario_id", u.id).eq("actividad", slug).eq("resultado", "en_curso");
  for (const p of (enCurso.data ?? []) as unknown as Partida[]) await finalizar(db, p, "abandonada");

  const objetivo = a.tipo === "palabra" ? { indice: crypto.getRandomValues(new Uint32Array(1))[0] % PALABRAS.length } : null;
  const { data, error } = await db
    .from("partidas")
    .insert({ usuario_id: u.id, actividad: slug, version: a.version, tipo: a.tipo, objetivo, numero: (previas.count ?? 0) + 1 })
    .select("id")
    .single();
  if (error || !data) return { error: "No pudimos empezar la partida. Probá de nuevo." };
  return { id: data.id };
}

export async function jugarPalabra(id: string, entrada: string): Promise<{ marcas?: Marca[]; error?: string; final?: Final }> {
  const { db, p } = await partidaPropia(id);
  if (p.resultado !== "en_curso") return { error: "La partida ya terminó." };
  const a = actividad(p.actividad);
  if (a?.tipo !== "palabra") return { error: "Partida inválida." };
  const c = a.contenido as ContenidoPalabra;
  const palabra = normalizar(entrada);
  if (!valida(palabra, c.largo)) return { error: `Tiene que tener ${c.largo} letras.` };
  const objetivo = PALABRAS[p.objetivo?.indice ?? 0];
  const marcas = marcar(palabra, objetivo);
  const acierto = palabra === objetivo;
  await anotar(db, p, { t: momento(p), tipo: "intento", palabra, acierto, marcas });
  const intentos = p.eventos.filter((e) => e.tipo === "intento").length;
  if (acierto) return { marcas, final: await finalizar(db, p, "resuelta") };
  if (intentos >= c.intentos) return { marcas, final: { ...(await finalizar(db, p, "no_resuelta")), solucion: objetivo } };
  return { marcas };
}

export async function pistaPalabra(id: string): Promise<{ posicion?: number; letra?: string; error?: string }> {
  const { db, p } = await partidaPropia(id);
  if (p.resultado !== "en_curso") return { error: "La partida ya terminó." };
  const a = actividad(p.actividad);
  if (a?.tipo !== "palabra") return { error: "Partida inválida." };
  if (p.eventos.filter((e) => e.tipo === "pista").length >= a.contenido.pistas) return { error: "Ya usaste la pista de esta partida." };
  const objetivo = PALABRAS[p.objetivo?.indice ?? 0];
  const sabidas = new Set<number>();
  for (const e of p.eventos) if (e.tipo === "intento") e.marcas.forEach((m, i) => m === "ok" && sabidas.add(i));
  const posicion = [...objetivo].findIndex((_, i) => !sabidas.has(i));
  if (posicion < 0) return { error: "Ya tenés todas las letras en su lugar." };
  await anotar(db, p, { t: momento(p), tipo: "pista", detalle: `letra ${posicion + 1}` });
  return { posicion, letra: objetivo[posicion] };
}

const grilla = z.array(z.array(z.string().max(1))).max(15);

export async function comprobarCrucigrama(id: string, entrada: string[][]) {
  const { db, p } = await partidaPropia(id);
  if (p.resultado !== "en_curso") return { error: "La partida ya terminó." };
  const g = grilla.safeParse(entrada);
  const sol = CRUCIGRAMAS[`${p.actividad}@${p.version}`];
  if (!g.success || !sol) return { error: "Grilla inválida." };
  const normal = g.data.map((f) => f.map((l) => normalizar(l)));
  const { errores, incompletas } = corregirCrucigrama(normal, sol);
  const mal: [number, number][] = [];
  sol.forEach((fila, f) => [...fila].forEach((l, k) => l !== "#" && normal[f]?.[k] && normal[f][k] !== l && mal.push([f, k])));
  await anotar(db, p, { t: momento(p), tipo: "comprobar", errores, incompletas });
  if (errores === 0 && incompletas === 0) return { errores, incompletas, mal, final: await finalizar(db, p, "resuelta") };
  return { errores, incompletas, mal };
}

export async function pistaCrucigrama(id: string, entrada: string[][]) {
  const { db, p } = await partidaPropia(id);
  if (p.resultado !== "en_curso") return { error: "La partida ya terminó." };
  const a = actividad(p.actividad);
  const sol = CRUCIGRAMAS[`${p.actividad}@${p.version}`];
  const g = grilla.safeParse(entrada);
  if (a?.tipo !== "crucigrama" || !sol || !g.success) return { error: "Partida inválida." };
  if (p.eventos.filter((e) => e.tipo === "pista").length >= (a.contenido as ContenidoCrucigrama).pistas) return { error: "Ya usaste las pistas de esta partida." };
  for (let f = 0; f < sol.length; f++)
    for (let k = 0; k < sol[f].length; k++) {
      if (sol[f][k] === "#" || normalizar(g.data[f]?.[k] ?? "") === sol[f][k]) continue;
      await anotar(db, p, { t: momento(p), tipo: "pista", detalle: `casillero ${f + 1},${k + 1}` });
      return { fila: f, col: k, letra: sol[f][k] };
    }
  return { error: "No hay casilleros para revelar." };
}

export async function comprobarEinstein(id: string, entrada: Record<string, string[]>) {
  const { db, p } = await partidaPropia(id);
  if (p.resultado !== "en_curso") return { error: "La partida ya terminó." };
  const a = actividad(p.actividad);
  const sol = EINSTEIN[`${p.actividad}@${p.version}`];
  const v = z.record(z.string(), z.array(z.string().max(40)).max(10)).safeParse(entrada);
  if (a?.tipo !== "einstein" || !sol || !v.success) return { error: "Partida inválida." };
  const { errores, incompletas } = corregirEinstein(v.data, sol);
  await anotar(db, p, { t: momento(p), tipo: "comprobar", errores, incompletas });
  if (errores === 0 && incompletas === 0) return { errores, incompletas, final: await finalizar(db, p, "resuelta") };
  return { errores, incompletas, sillas: (a.contenido as ContenidoEinstein).sillas };
}

export async function abandonarPartida(id: string): Promise<{ final?: Final; error?: string }> {
  const { db, p } = await partidaPropia(id);
  if (p.resultado !== "en_curso") return { error: "La partida ya terminó." };
  return { final: await finalizar(db, p, "abandonada") };
}

export async function responderPartida(id: string, respuesta: string): Promise<{ error?: string }> {
  const { db, p, usuario } = await partidaPropia(id);
  if (!["si", "mas_o_menos", "no"].includes(respuesta)) return { error: "Respuesta inválida." };
  const { error } = await db
    .from("respuestas_encuesta")
    .insert({ usuario_id: usuario, encuesta: "post_partida", partida_id: p.id, respuestas: { muestra_como_pienso: respuesta, actividad: p.actividad } });
  if (error && error.code !== "23505") return { error: "No pudimos guardar tu respuesta." };
  return {};
}
