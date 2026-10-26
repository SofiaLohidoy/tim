// Genera docs/mockups/landing.html desde la landing renderizada, para revisarla fuera del repo
// (el artifact que ve Sofía). Uso: con el dev server levantado, `node scripts/mockup-landing.mjs [url]`.
import { readFile, writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3001";
const variantes = {};
for (const v of ["a", "b"]) {
  const html = await (await fetch(`${base}/l/${v}`)).text();
  const ini = html.indexOf('<div class="tl">');
  const fin = html.lastIndexOf("</footer>") + "</footer>".length;
  variantes[v] = html
    .slice(ini, fin)
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<template[\s\S]*?<\/template>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/href="\/(?!\/)/g, 'href="#');
}

// El h1 es lo único que cambia entre variantes: se arma un selector para comparar.
const h1 = (s) => s.match(/<h1>[\s\S]*?<\/h1>/)[0];
const css = await readFile(new URL("../src/app/(landing)/landing.css", import.meta.url), "utf8");

const pagina = `<title>Landing TIM</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap">
<style>
:root{--font-manrope:"Manrope";--font-inter:"Inter"}
body{margin:0;background:#FAF8F4}
.revision{position:fixed;z-index:99;left:50%;bottom:max(16px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:6px;align-items:center;padding:6px;border-radius:14px;background:#102E28;color:#FAF8F4;font:600 13px/1 Inter,system-ui,sans-serif;box-shadow:0 12px 30px -10px rgb(0 0 0 / .5)}
.revision span{padding:0 8px;opacity:.7}
.revision button{border:0;border-radius:10px;padding:9px 12px;background:transparent;color:inherit;font:inherit;cursor:pointer}
.revision button[aria-pressed=true]{background:#AA8CFA;color:#102E28}
${css}
</style>
${variantes.a}
<div class="revision" role="group" aria-label="Variante del título">
  <span>Título</span>
  <button type="button" aria-pressed="true" data-v="a">A</button>
  <button type="button" aria-pressed="false" data-v="b">B</button>
</div>
<script>
const H = { a: ${JSON.stringify(h1(variantes.a))}, b: ${JSON.stringify(h1(variantes.b))} };
document.querySelectorAll(".revision button").forEach((b) => b.addEventListener("click", () => {
  document.querySelector(".tl h1").outerHTML = H[b.dataset.v];
  document.querySelectorAll(".revision button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
}));
document.querySelectorAll("form").forEach((f) => f.addEventListener("submit", (e) => e.preventDefault()));
addEventListener("scroll", () => document.querySelector(".tl .nav").classList.toggle("solida", scrollY > 24), { passive: true });
</script>
`;
await writeFile(new URL("../docs/mockups/landing.html", import.meta.url), pagina);
console.log("docs/mockups/landing.html listo");
