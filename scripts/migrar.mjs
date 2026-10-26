// Aplica las migraciones pendientes de supabase/migrations/.
//   pnpm migrar dev     → tim-dev (siempre primero)
//   pnpm migrar prod    → producción (después de probar en dev; ver skill migracion)
// Usa la sesión de `supabase login`; no necesita la clave de la base. Deja el CLI apuntando a tim-dev.
import { execFileSync } from "node:child_process";

const PROD = "xvzkijllizurvmmhmxvl";
const destino = process.argv[2];
if (destino !== "dev" && destino !== "prod") {
  console.error("Uso: pnpm migrar dev | pnpm migrar prod");
  process.exit(1);
}
const sb = (args) => execFileSync("supabase", [...args, "--yes"], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const proyectos = JSON.parse(sb(["projects", "list", "-o", "json"]));
const dev = proyectos.find((p) => p.name === "tim-dev");
if (!dev) {
  console.error("No existe tim-dev. Corré primero `pnpm preparar`.");
  process.exit(1);
}
const refDev = dev.id ?? dev.ref;
const ref = destino === "prod" ? PROD : refDev;
sb(["link", "--project-ref", ref]);
console.log(sb(["db", "push"]));
if (destino === "prod") sb(["link", "--project-ref", refDev]);
console.log(`Migraciones aplicadas en ${destino === "prod" ? "PRODUCCIÓN" : "tim-dev"}.`);
