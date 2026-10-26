import { describe, expect, it } from "vitest";
import { armarDevolucion, dimensionesPara, type Dimension, type EvaluacionEnviada } from "@/lib/devoluciones";

const dims: Dimension[] = [
  { id: "d1", orden: 1, nombre: "Comprensión del problema", instancia: "ambas" },
  { id: "d2", orden: 2, nombre: "Análisis y fundamentación", instancia: "individual" },
  { id: "d4", orden: 4, nombre: "Comunicación y colaboración", instancia: "grupal" },
];
const niveles = [
  { id: "n1", orden: 1, nombre: "Todavía no se observa" },
  { id: "n3", orden: 3, nombre: "Se observa con claridad" },
  { id: "n4", orden: 4, nombre: "Se destaca" },
];

const mentorAna: EvaluacionEnviada = {
  rol_evaluador: "mentor",
  objetivo: "persona",
  estudiante_id: "ana",
  equipo_id: "e1",
  respuestas: { d1: { nivel: "n3", obs: "Hizo las preguntas clave." }, d2: { nivel: "n4" }, d4: { nivel: "n1" } },
  comentario: "Muy buena energía.",
};
const mentorBeto: EvaluacionEnviada = { ...mentorAna, estudiante_id: "beto", comentario: null };
const jurado: EvaluacionEnviada = {
  rol_evaluador: "jurado",
  objetivo: "equipo",
  estudiante_id: null,
  equipo_id: "e1",
  respuestas: { d1: { nivel: "n4" }, d2: { nivel: "n1" }, d4: { nivel: "n3", obs: "Se repartieron bien el pitch." } },
  comentario: null,
};
const otroEquipo: EvaluacionEnviada = { ...jurado, equipo_id: "e2", respuestas: { d1: { nivel: "n1" } } };

describe("armarDevolucion", () => {
  const d = armarDevolucion({
    estudianteId: "ana",
    equipoId: "e1",
    equipoNombre: "Equipo 1",
    dimensiones: dims,
    niveles,
    evaluaciones: [mentorAna, mentorBeto, jurado, otroEquipo],
  });

  it("toma solo las evaluaciones de la persona y de su equipo", () => {
    expect(d.dimensiones[0].individual).toEqual([
      { quien: "mentor", nivel: "Se observa con claridad", orden: 3, obs: "Hizo las preguntas clave." },
    ]);
    expect(d.dimensiones[0].equipo).toEqual([{ quien: "jurado", nivel: "Se destaca", orden: 4, obs: null }]);
  });

  it("respeta la instancia: lo individual no muestra equipo y lo grupal no muestra persona", () => {
    const analisis = d.dimensiones.find((x) => x.id === "d2")!;
    expect(analisis.equipo).toEqual([]);
    const comunicacion = d.dimensiones.find((x) => x.id === "d4")!;
    expect(comunicacion.individual).toEqual([]);
    expect(comunicacion.equipo[0].obs).toBe("Se repartieron bien el pitch.");
  });

  it("incluye los comentarios generales", () => {
    expect(d.comentarios).toEqual([{ quien: "mentor", texto: "Muy buena energía." }]);
  });

  it("sin evaluaciones, no inventa dimensiones", () => {
    const vacia = armarDevolucion({ estudianteId: "x", equipoId: "e9", equipoNombre: "E9", dimensiones: dims, niveles, evaluaciones: [] });
    expect(vacia.dimensiones).toEqual([]);
  });
});

describe("dimensionesPara", () => {
  it("el mentor evalúa individual y ambas; el jurado grupal y ambas", () => {
    expect(dimensionesPara("mentor", dims).map((x) => x.id)).toEqual(["d1", "d2"]);
    expect(dimensionesPara("jurado", dims).map((x) => x.id)).toEqual(["d1", "d4"]);
  });
});
