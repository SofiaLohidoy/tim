// Tipos compartidos de las actividades (fase B). El contenido público viaja al navegador; las
// soluciones viven en soluciones.ts, que es solo de servidor.

export type Tipo = "palabra" | "crucigrama" | "einstein";

export type Pista = { n: number; fila: number; col: number; largo: number; texto: string };

export type ContenidoPalabra = { largo: number; intentos: number; pistas: number };
export type ContenidoCrucigrama = { filas: number; columnas: number; negras: [number, number][]; horizontales: Pista[]; verticales: Pista[]; pistas: number };
export type Restriccion =
  | { tipo: "en"; cat: string; valor: string; silla: number }
  | { tipo: "mismo"; a: [string, string]; b: [string, string] }
  | { tipo: "distinto"; a: [string, string]; b: [string, string] }
  | { tipo: "derecha"; a: [string, string]; b: [string, string] }
  | { tipo: "antes"; a: [string, string]; b: [string, string] }
  | { tipo: "vecinos"; a: [string, string]; b: [string, string] }
  | { tipo: "no_vecinos"; a: [string, string]; b: [string, string] }
  | { tipo: "punta"; a: [string, string] }
  | { tipo: "no_punta"; a: [string, string] };
export type ContenidoEinstein = {
  sillas: number;
  categorias: { clave: string; nombre: string; valores: string[] }[];
  pistas: { texto: string; regla: Restriccion }[];
};

export type Actividad = { proximamente?: boolean; tituloTentativo?: string } & (
  | { slug: string; version: number; tipo: "palabra"; titulo: string; descripcion: string; minutos: number; contenido: ContenidoPalabra }
  | { slug: string; version: number; tipo: "crucigrama"; titulo: string; descripcion: string; minutos: number; contenido: ContenidoCrucigrama }
  | { slug: string; version: number; tipo: "einstein"; titulo: string; descripcion: string; minutos: number; contenido: ContenidoEinstein });

/** Lo que pasa en una partida, con su momento (ms desde el inicio). Es la materia prima de las señales. */
export type EventoPartida =
  | { t: number; tipo: "intento"; palabra: string; acierto: boolean; marcas: Marca[] }
  | { t: number; tipo: "pista"; detalle: string }
  | { t: number; tipo: "comprobar"; errores: number; incompletas: number }
  | { t: number; tipo: "abandono" }
  | { t: number; tipo: "fin"; resultado: "resuelta" | "no_resuelta" };

export type Marca = "ok" | "esta" | "no";
