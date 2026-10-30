import empresas from "./empresas.json";
// Catálogo compartido con el generador del PDF. Archivos proporcionados por Sofía.
export const EMPRESAS_HACKATON = empresas;

/** Una elección histórica retirada se muestra sin selección, sin tocar las entregas. */
export function empresaParticipante(nombre: string | null): string | null {
  return EMPRESAS_HACKATON.some(e=>e.nombre===nombre)?nombre:null;
}
