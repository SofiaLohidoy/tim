import { describe, expect, it } from "vitest";
import { avanzar, respuestasDelCamino } from "@/lib/arquetipo";

describe("árbol de arquetipos (Anexo 2)", () => {
  it("empieza preguntando si sabe qué quiere", () => {
    expect(avanzar({})).toEqual({ pregunta: "sabe_que_quiere" });
  });

  it.each([
    [{ sabe_que_quiere: false }, "no_sabe_que_quiere"],
    [{ sabe_que_quiere: true, conoce_fortalezas: false }, "no_identifica_fortalezas"],
    [{ sabe_que_quiere: true, conoce_fortalezas: true, sabe_demostrar: false }, "no_sabe_demostrar"],
    [{ sabe_que_quiere: true, conoce_fortalezas: true, sabe_demostrar: true, accede: true }, "accede"],
    [
      { sabe_que_quiere: true, conoce_fortalezas: true, sabe_demostrar: true, accede: false, cambia_rubro: false },
      "hace_todo_bien",
    ],
    [
      { sabe_que_quiere: true, conoce_fortalezas: true, sabe_demostrar: true, accede: false, cambia_rubro: true },
      "reorientacion",
    ],
  ] as const)("%o → %s", (respuestas, esperado) => {
    expect(avanzar(respuestas)).toEqual({ arquetipo: esperado });
  });

  it("descarta respuestas que quedaron fuera del camino al cambiar una anterior", () => {
    expect(
      respuestasDelCamino({ sabe_que_quiere: false, conoce_fortalezas: true, sabe_demostrar: true }),
    ).toEqual({ sabe_que_quiere: false });
  });
});
