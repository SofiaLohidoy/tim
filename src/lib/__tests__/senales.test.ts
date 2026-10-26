import { describe, expect, it } from "vitest";
import { autocorreccion, persistencia, senalesDe, usoDeInformacion } from "@/lib/actividades/senales";
import { marcar } from "@/lib/actividades/palabra";
import type { EventoPartida } from "@/lib/actividades/tipos";

const intento = (t: number, palabra: string, objetivo: string): EventoPartida => ({
  t, tipo: "intento", palabra, acierto: palabra === objetivo, marcas: marcar(palabra, objetivo),
});
const comprobar = (t: number, errores: number): EventoPartida => ({ t, tipo: "comprobar", errores, incompletas: 0 });

describe("persistencia", () => {
  it("1 si se equivocó y lo resolvió", () => {
    expect(persistencia([intento(1, "PERRO", "PARED"), intento(2, "PARED", "PARED")], "resuelta")?.valor).toBe(1);
  });
  it("0,5 si siguió después del error pero no lo resolvió", () => {
    expect(persistencia([comprobar(1, 3), comprobar(2, 2), { t: 3, tipo: "abandono" }], "abandonada")?.valor).toBe(0.5);
  });
  it("0 si abandonó apenas se equivocó", () => {
    expect(persistencia([comprobar(1, 3), { t: 2, tipo: "abandono" }], "abandonada")?.valor).toBe(0);
  });
  it("sin errores no hay nada que superar: no hay señal", () => {
    expect(persistencia([intento(1, "PARED", "PARED")], "resuelta")).toBeNull();
  });
});

describe("uso de información", () => {
  it("cuenta los intentos que respetan lo ya sabido", () => {
    const s = usoDeInformacion([intento(1, "PERRO", "PARED"), intento(2, "MUNDO", "PARED"), intento(3, "PARED", "PARED")]);
    expect(s?.detalle).toMatchObject({ consistentes: 1, evaluados: 2 });
    expect(s?.valor).toBe(0.5);
  });
  it("con un solo intento no hay señal", () => {
    expect(usoDeInformacion([intento(1, "PARED", "PARED")])).toBeNull();
  });
});

describe("autocorrección", () => {
  it("mide si los errores bajan de una comprobación a la siguiente", () => {
    const s = autocorreccion([comprobar(1, 4), comprobar(2, 2), comprobar(3, 3), comprobar(4, 0)]);
    expect(s?.detalle).toEqual({ pares: 3, corregidos: 2 });
  });
  it("si nunca comprobó con errores, no hay señal", () => {
    expect(autocorreccion([comprobar(1, 0)])).toBeNull();
  });
});

describe("senalesDe", () => {
  it("la palabra da persistencia y uso de información; el crucigrama, persistencia y autocorrección", () => {
    expect(senalesDe("palabra", [intento(1, "PERRO", "PARED"), intento(2, "PARED", "PARED")], "resuelta").map((s) => s.clave)).toEqual(["persistencia", "uso_de_informacion"]);
    expect(senalesDe("crucigrama", [comprobar(1, 2), comprobar(2, 0)], "resuelta").map((s) => s.clave)).toEqual(["persistencia", "autocorreccion"]);
  });
});
