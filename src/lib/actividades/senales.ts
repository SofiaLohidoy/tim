import type { EventoPartida, Marca, Tipo } from "./tipos";
import { consistente } from "./palabra";

// Señales de una partida. Funciones puras: la regla de cada una está escrita en docs/senales.md y
// se testea en src/lib/__tests__/senales.test.ts. Una señal es una hipótesis, no una medición.
// `null` = la partida no da información para esa señal (no se guarda, no se muestra).

export const REGLA = "v1-2026-10-26";

export type Senal = { clave: "persistencia" | "uso_de_informacion" | "autocorreccion"; valor: number; detalle: Record<string, unknown> };

const esError = (e: EventoPartida) => (e.tipo === "intento" && !e.acierto) || (e.tipo === "comprobar" && e.errores > 0);
const esJugada = (e: EventoPartida) => e.tipo === "intento" || e.tipo === "comprobar";

/** Persistencia: después del primer error, ¿siguió intentando? ¿lo resolvió? */
export function persistencia(eventos: EventoPartida[], resultado: string): Senal | null {
  const primero = eventos.findIndex(esError);
  if (primero < 0) return null;
  const siguio = eventos.slice(primero + 1).some(esJugada);
  const valor = resultado === "resuelta" ? 1 : siguio ? 0.5 : 0;
  return { clave: "persistencia", valor, detalle: { errores: eventos.filter(esError).length, siguio, resultado } };
}

/** Uso de información (palabra): ¿cada intento respeta lo que dijeron los anteriores? */
export function usoDeInformacion(eventos: EventoPartida[]): Senal | null {
  const intentos = eventos.filter((e): e is Extract<EventoPartida, { tipo: "intento" }> => e.tipo === "intento");
  if (intentos.length < 2) return null;
  let consistentes = 0;
  for (let i = 1; i < intentos.length; i++) {
    const previos = intentos.slice(0, i).map((x) => ({ palabra: x.palabra, marcas: x.marcas as Marca[] }));
    if (consistente(intentos[i].palabra, previos)) consistentes++;
  }
  const evaluados = intentos.length - 1;
  return {
    clave: "uso_de_informacion",
    valor: Math.round((consistentes / evaluados) * 1000) / 1000,
    detalle: { consistentes, evaluados, pistas: eventos.filter((e) => e.tipo === "pista").length },
  };
}

/** Autocorrección (crucigrama, acertijo): después de una comprobación con errores, ¿la siguiente tiene menos? */
export function autocorreccion(eventos: EventoPartida[]): Senal | null {
  const comps = eventos.filter((e): e is Extract<EventoPartida, { tipo: "comprobar" }> => e.tipo === "comprobar");
  let pares = 0;
  let corregidos = 0;
  for (let i = 0; i + 1 < comps.length; i++) {
    if (comps[i].errores === 0) continue;
    pares++;
    if (comps[i + 1].errores < comps[i].errores) corregidos++;
  }
  if (pares === 0) return null;
  return { clave: "autocorreccion", valor: Math.round((corregidos / pares) * 1000) / 1000, detalle: { pares, corregidos } };
}

export function senalesDe(tipo: Tipo, eventos: EventoPartida[], resultado: string): Senal[] {
  const lista = [
    persistencia(eventos, resultado),
    tipo === "palabra" ? usoDeInformacion(eventos) : autocorreccion(eventos),
  ];
  return lista.filter((s): s is Senal => s !== null);
}

/** Cómo se cuenta cada señal en la pantalla. Lenguaje de señal, nunca de nota. */
export function describir(s: Senal): { titulo: string; texto: string } {
  if (s.clave === "persistencia") {
    return {
      titulo: "Persistencia",
      texto: s.valor === 1 ? "Te equivocaste y seguiste hasta resolverlo." : s.valor > 0 ? "Después de un error seguiste intentando." : "Después del primer error dejaste la partida.",
    };
  }
  if (s.clave === "uso_de_informacion") {
    const d = s.detalle as { consistentes: number; evaluados: number };
    return { titulo: "Uso de la información", texto: `${d.consistentes} de ${d.evaluados} intentos tuvieron en cuenta lo que ya sabías.` };
  }
  const d = s.detalle as { pares: number; corregidos: number };
  return { titulo: "Autocorrección", texto: `Después de comprobar con errores, corregiste ${d.corregidos} de ${d.pares} veces.` };
}
