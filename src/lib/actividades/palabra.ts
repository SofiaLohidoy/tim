import type { Marca } from "./tipos";

/** Mayúsculas y sin tildes (la Ñ se respeta): "Árbol" → "ARBOL". */
export function normalizar(s: string): string {
  return s
    .toUpperCase()
    .replace(/Ñ/g, "\u0000")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0000/g, "Ñ")
    .trim();
}

export const valida = (s: string, largo: number) => new RegExp(`^[A-ZÑ]{${largo}}$`).test(s);

/**
 * Marcas de un intento contra la palabra objetivo, como en Wordle: primero las letras en su lugar
 * ("ok"); después, de izquierda a derecha, las que están en otro lugar ("esta") sin pasarse de la
 * cantidad de veces que aparecen en el objetivo.
 */
export function marcar(intento: string, objetivo: string): Marca[] {
  const marcas: Marca[] = Array(objetivo.length).fill("no");
  const restan = new Map<string, number>();
  for (let i = 0; i < objetivo.length; i++) {
    if (intento[i] === objetivo[i]) marcas[i] = "ok";
    else restan.set(objetivo[i], (restan.get(objetivo[i]) ?? 0) + 1);
  }
  for (let i = 0; i < objetivo.length; i++) {
    if (marcas[i] === "ok") continue;
    const n = restan.get(intento[i]) ?? 0;
    if (n > 0) {
      marcas[i] = "esta";
      restan.set(intento[i], n - 1);
    }
  }
  return marcas;
}

/** ¿El intento respeta todo lo que dijeron los intentos anteriores? (podría ser la respuesta) */
export function consistente(intento: string, anteriores: { palabra: string; marcas: Marca[] }[]): boolean {
  return anteriores.every((a) => marcar(a.palabra, intento).join() === a.marcas.join());
}
