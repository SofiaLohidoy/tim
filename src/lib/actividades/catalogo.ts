import type { Actividad, Pista } from "./tipos";

// Catálogo de actividades. Contenido propio de TIM, versionado: si se cambia una actividad que ya
// se jugó, se sube `version` y se agrega su solución nueva en soluciones.ts.

const NEGRAS_MINI: [number, number][] = [
  [1, 1],
  [1, 3],
  [3, 1],
  [3, 3],
];
const mini = (h: [string, string, string], v: [string, string, string]): { horizontales: Pista[]; verticales: Pista[] } => ({
  horizontales: [
    { n: 1, fila: 0, col: 0, largo: 5, texto: h[0] },
    { n: 4, fila: 2, col: 0, largo: 5, texto: h[1] },
    { n: 5, fila: 4, col: 0, largo: 5, texto: h[2] },
  ],
  verticales: [
    { n: 1, fila: 0, col: 0, largo: 5, texto: v[0] },
    { n: 2, fila: 0, col: 2, largo: 5, texto: v[1] },
    { n: 3, fila: 0, col: 4, largo: 5, texto: v[2] },
  ],
});

export const ACTIVIDADES: Actividad[] = [
  {
    slug: "palabra",
    proximamente: true,
    tituloTentativo: "Palabras en juego",
    version: 1,
    tipo: "palabra",
    titulo: "Adivinar la palabra",
    descripcion: "Una palabra de 5 letras en 6 intentos. Cada intento te dice qué letras están y dónde.",
    minutos: 5,
    contenido: { largo: 5, intentos: 6, pistas: 1 },
  },
  {
    slug: "crucigrama-1",
    proximamente: true,
    tituloTentativo: "Conexiones",
    version: 1,
    tipo: "crucigrama",
    titulo: "Mini crucigrama: la mochila",
    descripcion: "Seis palabras que se cruzan. Podés comprobar cuando quieras.",
    minutos: 10,
    contenido: {
      filas: 5,
      columnas: 5,
      negras: NEGRAS_MINI,
      pistas: 2,
      ...mini(
        ["Se lleva al hombro para cargar cosas.", "Forma respetuosa de decir «vos».", "Árbol alto que crece cerca del agua."],
        ["Personaje de cuento con escoba voladora.", "Cada signo del abecedario.", "Mensaje de voz por WhatsApp."],
      ),
    },
  },
  {
    slug: "crucigrama-2",
    tituloTentativo: "Nuevas perspectivas",
    proximamente: true,
    version: 1,
    tipo: "crucigrama",
    titulo: "Mini crucigrama: la noche",
    descripcion: "Seis palabras que se cruzan. Podés comprobar cuando quieras.",
    minutos: 10,
    contenido: {
      filas: 5,
      columnas: 5,
      negras: NEGRAS_MINI,
      pistas: 2,
      ...mini(
        ["Tranquilidad, sin apuro.", "Cuando sale la luna.", "Teatro cantado."],
        ["Lo que hace un pájaro al amanecer.", "Se le agrega al café para un cortado.", "La hay en la playa y en el reloj."],
      ),
    },
  },
  {
    slug: "crucigrama-3",
    tituloTentativo: "Ideas en acción",
    proximamente: true,
    version: 1,
    tipo: "crucigrama",
    titulo: "Mini crucigrama: la lluvia",
    descripcion: "Seis palabras que se cruzan. Podés comprobar cuando quieras.",
    minutos: 10,
    contenido: {
      filas: 5,
      columnas: 5,
      negras: NEGRAS_MINI,
      pistas: 2,
      ...mini(
        ["Calzado alto para la lluvia.", "Se mira por capítulos.", "Lo que queda."],
        ["Dar un beso.", "Disparos o remates al arco.", "Lo que pisás."],
      ),
    },
  },
  {
    slug: "einstein-chico",
    tituloTentativo: "Decisiones",
    proximamente: true,
    version: 1,
    tipo: "einstein",
    titulo: "Acertijo: tres en la mesa",
    descripcion: "Tres personas, tres roles, tres bebidas. Deducí quién se sienta dónde con las pistas.",
    minutos: 10,
    contenido: {
      sillas: 3,
      categorias: [
        { clave: "nombre", nombre: "Persona", valores: ["Ana", "Bruno", "Carla"] },
        { clave: "rol", nombre: "Rol", valores: ["datos", "diseño", "pitch"] },
        { clave: "bebida", nombre: "Bebida", valores: ["mate", "café", "té"] },
      ],
      pistas: [
        { texto: "Ana se sienta en la silla del medio.", regla: { tipo: "en", cat: "nombre", valor: "Ana", silla: 2 } },
        { texto: "Quien toma café está inmediatamente a la derecha de quien hace el pitch.", regla: { tipo: "derecha", a: ["bebida", "café"], b: ["rol", "pitch"] } },
        { texto: "Bruno no hace diseño.", regla: { tipo: "distinto", a: ["nombre", "Bruno"], b: ["rol", "diseño"] } },
        { texto: "Quien hace datos toma té.", regla: { tipo: "mismo", a: ["rol", "datos"], b: ["bebida", "té"] } },
        { texto: "Carla no toma mate.", regla: { tipo: "distinto", a: ["nombre", "Carla"], b: ["bebida", "mate"] } },
        { texto: "Bruno toma té.", regla: { tipo: "mismo", a: ["nombre", "Bruno"], b: ["bebida", "té"] } },
      ],
    },
  },
  {
    slug: "einstein-equipo",
    tituloTentativo: "Estrategia",
    proximamente: true,
    version: 1,
    tipo: "einstein",
    titulo: "Acertijo: el equipo de la hackatón",
    descripcion: "Cuatro personas, cuatro roles, cuatro bebidas. Más pistas, más cruces.",
    minutos: 25,
    contenido: {
      sillas: 4,
      categorias: [
        { clave: "nombre", nombre: "Persona", valores: ["Ana", "Bruno", "Carla", "Dani"] },
        { clave: "rol", nombre: "Rol", valores: ["datos", "diseño", "pitch", "producto"] },
        { clave: "bebida", nombre: "Bebida", valores: ["mate", "café", "té", "agua"] },
      ],
      pistas: [
        { texto: "Bruno se sienta en una punta.", regla: { tipo: "punta", a: ["nombre", "Bruno"] } },
        { texto: "Quien toma mate está al lado de quien toma agua.", regla: { tipo: "vecinos", a: ["bebida", "mate"], b: ["bebida", "agua"] } },
        { texto: "Carla está inmediatamente a la derecha de Ana.", regla: { tipo: "derecha", a: ["nombre", "Carla"], b: ["nombre", "Ana"] } },
        { texto: "Quien hace diseño toma café.", regla: { tipo: "mismo", a: ["rol", "diseño"], b: ["bebida", "café"] } },
        { texto: "Quien hace el pitch está en la silla 3.", regla: { tipo: "en", cat: "rol", valor: "pitch", silla: 3 } },
        { texto: "Dani no está al lado de Bruno.", regla: { tipo: "no_vecinos", a: ["nombre", "Dani"], b: ["nombre", "Bruno"] } },
        { texto: "Ana hace datos.", regla: { tipo: "mismo", a: ["nombre", "Ana"], b: ["rol", "datos"] } },
        { texto: "Quien toma té no está en una punta.", regla: { tipo: "no_punta", a: ["bebida", "té"] } },
        { texto: "Quien toma agua hace producto.", regla: { tipo: "mismo", a: ["bebida", "agua"], b: ["rol", "producto"] } },
        { texto: "Dani se sienta más a la izquierda que Bruno.", regla: { tipo: "antes", a: ["nombre", "Dani"], b: ["nombre", "Bruno"] } },
        { texto: "Quien toma té hace el pitch.", regla: { tipo: "mismo", a: ["bebida", "té"], b: ["rol", "pitch"] } },
      ],
    },
  },
];

export const actividad = (slug: string) => ACTIVIDADES.find((a) => a.slug === slug) ?? null;
