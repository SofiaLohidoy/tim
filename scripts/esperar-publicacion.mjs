// Espera a que el último commit de main esté publicado en producción y lo confirma.
//   pnpm esperar-publicacion
// No necesita acceso a Vercel: compara el commit de /api/version con el de origin/main.
import { execSync } from "node:child_process";

const sitio = process.env.SITIO_PRODUCCION ?? "https://tim-alpha-eight.vercel.app";
execSync("git fetch -q origin main");
const esperado = execSync("git rev-parse origin/main").toString().trim();
const limite = Date.now() + 10 * 60_000;
process.stdout.write(`Esperando que ${sitio} publique ${esperado.slice(0, 7)}`);
while (Date.now() < limite) {
  try {
    const r = await fetch(`${sitio}/api/version`, { cache: "no-store" });
    const { commit } = await r.json();
    if (commit === esperado) {
      console.log(`\nPublicado: ${esperado.slice(0, 7)} está live en ${sitio}`);
      process.exit(0);
    }
  } catch {
    // El deploy nuevo todavía no responde: se reintenta.
  }
  process.stdout.write(".");
  await new Promise((r) => setTimeout(r, 10_000));
}
console.error("\nNo se publicó en 10 minutos. Revisá la pestaña Actions del repo (gh run list -w Publicar) y avisale a Joaquín si falló.");
process.exit(1);
