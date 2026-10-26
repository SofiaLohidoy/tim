import type { ContenidoEinstein, Restriccion } from "./tipos";

/** Asignación: por categoría, el valor que va en cada silla (índice 0 = silla 1). */
export type Asignacion = Record<string, string[]>;

function silla(a: Asignacion, [cat, valor]: [string, string]) {
  return a[cat]?.indexOf(valor) ?? -1;
}

export function cumple(r: Restriccion, a: Asignacion, sillas: number): boolean {
  switch (r.tipo) {
    case "en":
      return a[r.cat]?.[r.silla - 1] === r.valor;
    case "mismo":
      return silla(a, r.a) === silla(a, r.b);
    case "distinto":
      return silla(a, r.a) !== silla(a, r.b);
    case "derecha":
      return silla(a, r.a) === silla(a, r.b) + 1;
    case "antes":
      return silla(a, r.a) < silla(a, r.b);
    case "vecinos":
      return Math.abs(silla(a, r.a) - silla(a, r.b)) === 1;
    case "no_vecinos":
      return Math.abs(silla(a, r.a) - silla(a, r.b)) !== 1;
    case "punta":
      return [0, sillas - 1].includes(silla(a, r.a));
    case "no_punta":
      return ![0, sillas - 1].includes(silla(a, r.a));
  }
}

function permutaciones<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutaciones([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));
}

/** Todas las soluciones por fuerza bruta. Solo para tests: comprueba que el acertijo tenga una. */
export function resolver(c: ContenidoEinstein): Asignacion[] {
  const opciones = c.categorias.map((cat) => permutaciones(cat.valores));
  const out: Asignacion[] = [];
  const rec = (i: number, a: Asignacion) => {
    if (i === c.categorias.length) {
      if (c.pistas.every((p) => cumple(p.regla, a, c.sillas))) out.push({ ...a });
      return;
    }
    for (const p of opciones[i]) rec(i + 1, { ...a, [c.categorias[i].clave]: p });
  };
  rec(0, {});
  return out;
}

/** Casilleros mal y sin completar contra la solución. No dice cuáles: eso lo resuelve quien juega. */
export function corregir(a: Asignacion, solucion: Asignacion) {
  let errores = 0;
  let incompletas = 0;
  for (const [cat, valores] of Object.entries(solucion)) {
    valores.forEach((v, i) => {
      const puesto = a[cat]?.[i];
      if (!puesto) incompletas++;
      else if (puesto !== v) errores++;
    });
  }
  return { errores, incompletas };
}
