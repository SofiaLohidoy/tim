import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { ACTIVIDADES } from "@/lib/actividades/catalogo";
import { marcar, consistente, normalizar } from "@/lib/actividades/palabra";
import { resolver, corregir as corregirEinstein } from "@/lib/actividades/einstein";
import { celdas, corregir as corregirCrucigrama, palabraDe } from "@/lib/actividades/crucigrama";
import type { ContenidoCrucigrama, ContenidoEinstein } from "@/lib/actividades/tipos";

const { PALABRAS, CRUCIGRAMAS, EINSTEIN } = await import("@/lib/actividades/soluciones");

describe("adivinar la palabra", () => {
  it("marca letras en su lugar, en otro lugar y ausentes, sin contar de más las repetidas", () => {
    expect(marcar("PERRO", "PARED")).toEqual(["ok", "esta", "ok", "no", "no"]);
    expect(marcar("ALAMO", "ARBOL")).toEqual(["ok", "esta", "no", "no", "esta"]);
    expect(marcar("ARBOL", "ARBOL")).toEqual(["ok", "ok", "ok", "ok", "ok"]);
  });
  it("normaliza tildes pero respeta la Ñ", () => {
    expect(normalizar("árbol ")).toBe("ARBOL");
    expect(normalizar("niño")).toBe("NIÑO");
  });
  it("detecta si un intento respeta lo que dijeron los anteriores", () => {
    const previos = [{ palabra: "PERRO", marcas: marcar("PERRO", "PARED") }];
    expect(consistente("PARED", previos)).toBe(true);
    expect(consistente("MUNDO", previos)).toBe(false);
  });
  it("la lista de palabras es de 5 letras, sin repetir", () => {
    expect(PALABRAS.length).toBeGreaterThan(200);
    expect(PALABRAS.every((p) => /^[A-ZÑ]{5}$/.test(p))).toBe(true);
    expect(new Set(PALABRAS).size).toBe(PALABRAS.length);
  });
});

describe("crucigramas", () => {
  for (const a of ACTIVIDADES.filter((x) => x.tipo === "crucigrama")) {
    const c = a.contenido as ContenidoCrucigrama;
    const sol = CRUCIGRAMAS[`${a.slug}@${a.version}`];
    it(`${a.slug}: la solución respeta las negras y cada pista define una palabra de la lista`, () => {
      expect(sol).toBeDefined();
      for (const [f, k] of c.negras) expect(sol[f][k]).toBe("#");
      expect(celdas(c).every(([f, k]) => /[A-ZÑ]/.test(sol[f][k]))).toBe(true);
      for (const p of c.horizontales) expect(PALABRAS).toContain(palabraDe(sol, p, true));
      for (const p of c.verticales) expect(PALABRAS).toContain(palabraDe(sol, p, false));
    });
  }
  it("corrige contando errores y vacíos", () => {
    const sol = CRUCIGRAMAS["crucigrama-1@1"];
    const grilla = sol.map((f) => [...f].map((l) => (l === "#" ? "" : l)));
    expect(corregirCrucigrama(grilla, sol)).toEqual({ errores: 0, incompletas: 0 });
    grilla[0][0] = "X";
    grilla[4][4] = "";
    expect(corregirCrucigrama(grilla, sol)).toEqual({ errores: 1, incompletas: 1 });
  });
});

describe("acertijos de Einstein", () => {
  for (const a of ACTIVIDADES.filter((x) => x.tipo === "einstein")) {
    it(`${a.slug}: tiene una sola solución y es la guardada`, () => {
      const soluciones = resolver(a.contenido as ContenidoEinstein);
      expect(soluciones).toHaveLength(1);
      expect(soluciones[0]).toEqual(EINSTEIN[`${a.slug}@${a.version}`]);
    });
  }
  it("corrige sin decir qué casillero está mal", () => {
    const sol = EINSTEIN["einstein-chico@1"];
    expect(corregirEinstein({ nombre: ["Ana", "Bruno", "Carla"], rol: ["datos", "pitch", "diseño"], bebida: [] }, sol)).toEqual({ errores: 2, incompletas: 3 });
  });
});
