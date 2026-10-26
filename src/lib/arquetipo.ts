// Árbol de clasificación del Anexo 2 del BP (A2.1). Cada respuesta decide la siguiente pregunta;
// el arquetipo es el punto donde aparece la primera barrera. "accede" = el árbol termina sin
// barrera (la persona ya accede a las oportunidades que busca).
//
// Los textos al estudiante no lo etiquetan: describen un punto de partida, porque los arquetipos
// no son identidades fijas (A2.2) y una persona se mueve entre ellos.

export type Arquetipo =
  | "no_sabe_que_quiere"
  | "no_identifica_fortalezas"
  | "no_sabe_demostrar"
  | "hace_todo_bien"
  | "reorientacion"
  | "accede";

export type Pregunta = "sabe_que_quiere" | "conoce_fortalezas" | "sabe_demostrar" | "accede" | "cambia_rubro";
export type Respuestas = Partial<Record<Pregunta, boolean>>;

export const PREGUNTAS: Record<Pregunta, string> = {
  sabe_que_quiere: "¿Tenés claro en qué área o rol querés trabajar?",
  conoce_fortalezas: "¿Sabés cuáles son tus principales fortalezas?",
  sabe_demostrar: "¿Sabés cómo demostrarlas en un CV o una entrevista?",
  accede: "¿Conseguís acceder a las oportunidades que buscás?",
  cambia_rubro: "¿Estás cambiando de rubro o volviendo a trabajar después de un tiempo?",
};

/** Siguiente pregunta, o el arquetipo si el árbol ya terminó. */
export function avanzar(r: Respuestas): { pregunta: Pregunta } | { arquetipo: Arquetipo } {
  if (r.sabe_que_quiere === undefined) return { pregunta: "sabe_que_quiere" };
  if (!r.sabe_que_quiere) return { arquetipo: "no_sabe_que_quiere" };
  if (r.conoce_fortalezas === undefined) return { pregunta: "conoce_fortalezas" };
  if (!r.conoce_fortalezas) return { arquetipo: "no_identifica_fortalezas" };
  if (r.sabe_demostrar === undefined) return { pregunta: "sabe_demostrar" };
  if (!r.sabe_demostrar) return { arquetipo: "no_sabe_demostrar" };
  if (r.accede === undefined) return { pregunta: "accede" };
  if (r.accede) return { arquetipo: "accede" };
  if (r.cambia_rubro === undefined) return { pregunta: "cambia_rubro" };
  return { arquetipo: r.cambia_rubro ? "reorientacion" : "hace_todo_bien" };
}

/** Las respuestas que siguen siendo parte del camino (al volver atrás y cambiar una, las de abajo se descartan). */
export function respuestasDelCamino(r: Respuestas): Respuestas {
  const limpio: Respuestas = {};
  for (;;) {
    const paso = avanzar(limpio);
    if ("arquetipo" in paso) return limpio;
    const valor = r[paso.pregunta];
    if (valor === undefined) return limpio;
    limpio[paso.pregunta] = valor;
  }
}

export const PUNTO_DE_PARTIDA: Record<Arquetipo, { titulo: string; texto: string }> = {
  no_sabe_que_quiere: {
    titulo: "Estás explorando",
    texto: "Todavía estás definiendo hacia dónde ir. Los desafíos te sirven para probar áreas distintas y ver qué te gusta.",
  },
  no_identifica_fortalezas: {
    titulo: "Sabés a dónde querés ir",
    texto: "Tenés claro el rumbo. Los desafíos te van a mostrar en qué sos fuerte, con la mirada de otros.",
  },
  no_sabe_demostrar: {
    titulo: "Te falta mostrarlo",
    texto: "Sabés qué querés y qué podés ofrecer. Lo que falta es evidencia: para eso está TIM.",
  },
  hace_todo_bien: {
    titulo: "Hacés todo y no alcanza",
    texto: "Comunicás bien lo que sabés y aun así no llegan las oportunidades. La evidencia de un desafío suma otra señal.",
  },
  reorientacion: {
    titulo: "Estás cambiando de rumbo",
    texto: "Venís con experiencia. Los desafíos te ayudan a mostrar cómo tus capacidades sirven en el área nueva.",
  },
  accede: {
    titulo: "Ya estás en movimiento",
    texto: "Conseguís las oportunidades que buscás. Los desafíos suman evidencia para lo que venga.",
  },
};
