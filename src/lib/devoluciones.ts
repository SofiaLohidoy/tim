// Arma la devolución de cada estudiante a partir de las evaluaciones ENVIADAS. Función pura: se
// testea sin base (src/lib/__tests__/devoluciones.test.ts) y la usa el organizador al "preparar".
//
// Qué entra: por cada dimensión de la rúbrica, lo que el mentor observó de la persona (instancia
// individual o ambas) y lo que el jurado observó del equipo (instancia grupal o ambas). Los
// borradores no entran: lo que no se envió no se publica.

export type Nivel = { id: string; orden: number; nombre: string };
export type Dimension = { id: string; orden: number; nombre: string; instancia: "grupal" | "individual" | "ambas" };
export type Respuesta = { nivel?: string | null; obs?: string | null };
export type EvaluacionEnviada = {
  rol_evaluador: "mentor" | "jurado";
  objetivo: "persona" | "equipo";
  estudiante_id: string | null;
  equipo_id: string;
  respuestas: Record<string, Respuesta>;
  comentario: string | null;
};

export type Observacion = { quien: "mentor" | "jurado"; nivel: string | null; orden: number | null; obs: string | null };
export type ContenidoDevolucion = {
  version: 1;
  equipo: string;
  dimensiones: { id: string; nombre: string; individual: Observacion[]; equipo: Observacion[] }[];
  comentarios: { quien: "mentor" | "jurado"; texto: string }[];
};

export function armarDevolucion(args: {
  estudianteId: string;
  equipoId: string;
  equipoNombre: string;
  dimensiones: Dimension[];
  niveles: Nivel[];
  evaluaciones: EvaluacionEnviada[];
}): ContenidoDevolucion {
  const nivel = new Map(args.niveles.map((n) => [n.id, n]));
  const individuales = args.evaluaciones.filter(
    (e) => e.objetivo === "persona" && e.estudiante_id === args.estudianteId && e.equipo_id === args.equipoId,
  );
  const deEquipo = args.evaluaciones.filter((e) => e.objetivo === "equipo" && e.equipo_id === args.equipoId);

  const observar = (e: EvaluacionEnviada, dimId: string): Observacion | null => {
    const r = e.respuestas[dimId];
    if (!r || (!r.nivel && !r.obs?.trim())) return null;
    const n = r.nivel ? nivel.get(r.nivel) : undefined;
    return { quien: e.rol_evaluador, nivel: n?.nombre ?? null, orden: n?.orden ?? null, obs: r.obs?.trim() || null };
  };

  return {
    version: 1,
    equipo: args.equipoNombre,
    dimensiones: [...args.dimensiones]
      .sort((a, b) => a.orden - b.orden)
      .map((d) => ({
        id: d.id,
        nombre: d.nombre,
        individual: d.instancia === "grupal" ? [] : individuales.map((e) => observar(e, d.id)).filter((o) => o !== null),
        equipo: d.instancia === "individual" ? [] : deEquipo.map((e) => observar(e, d.id)).filter((o) => o !== null),
      }))
      .filter((d) => d.individual.length > 0 || d.equipo.length > 0),
    comentarios: [...individuales, ...deEquipo]
      .filter((e) => e.comentario?.trim())
      .map((e) => ({ quien: e.rol_evaluador, texto: e.comentario!.trim() })),
  };
}

/** Qué dimensiones evalúa cada rol: el mentor a la persona, el jurado al equipo. */
export function dimensionesPara<T extends { instancia: string }>(rol: "mentor" | "jurado", dims: T[]): T[] {
  return dims.filter((d) => (rol === "mentor" ? d.instancia !== "grupal" : d.instancia !== "individual"));
}
