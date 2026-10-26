// Código de asistencia: 6 caracteres sin los que se confunden al leerlos en una pantalla
// (0/O, 1/I/L). Se genera con crypto, no con Math.random.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function nuevoCodigo(largo = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(largo));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}
