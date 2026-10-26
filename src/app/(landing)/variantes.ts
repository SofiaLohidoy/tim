// Dos títulos del hero con reparto fijo por visitante (cookie `tim_var`, la pone src/proxy.ts).
// Sirven para ver qué mensaje convierte más. Para sumar o cambiar una variante: acá y en proxy.ts.

export const VARIANTES = ["a", "b"] as const;
export type Variante = (typeof VARIANTES)[number];

export const TITULOS: Record<Variante, { antes: string; destacado: string; despues: string }> = {
  a: { antes: "Tu capacidad, ", destacado: "en evidencia.", despues: "" },
  b: { antes: "Mostrá ", destacado: "cómo pensás", despues: ", no solo tu CV." },
};

export function esVariante(v: string | undefined): v is Variante {
  return v === "a" || v === "b";
}
