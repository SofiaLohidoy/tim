import type { ContenidoCrucigrama } from "./tipos";

/** Casilleros de letra (no negros) de la grilla. */
export function celdas(c: ContenidoCrucigrama): [number, number][] {
  const negras = new Set(c.negras.map(([f, k]) => `${f},${k}`));
  const out: [number, number][] = [];
  for (let f = 0; f < c.filas; f++) for (let k = 0; k < c.columnas; k++) if (!negras.has(`${f},${k}`)) out.push([f, k]);
  return out;
}

/** Errores y casilleros vacíos contra la solución (una fila por string, "#" = negra). */
export function corregir(grilla: string[][], solucion: string[]) {
  let errores = 0;
  let incompletas = 0;
  solucion.forEach((fila, f) =>
    [...fila].forEach((letra, k) => {
      if (letra === "#") return;
      const puesto = grilla[f]?.[k] ?? "";
      if (!puesto) incompletas++;
      else if (puesto !== letra) errores++;
    }),
  );
  return { errores, incompletas };
}

/** La palabra que define una pista, leída de la solución. Para el test de coherencia del contenido. */
export function palabraDe(solucion: string[], p: { fila: number; col: number; largo: number }, horizontal: boolean) {
  return Array.from({ length: p.largo }, (_, i) => (horizontal ? solucion[p.fila][p.col + i] : solucion[p.fila + i][p.col])).join("");
}
