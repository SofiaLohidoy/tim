# 005 — Landing estática, variantes por rewrite en el proxy y medición propia

Fecha: 25/10/2026 · Estado: aceptada

## Contexto
La landing es el instrumento principal para medir interés de los dos lados (estudiantes y empresas). Tiene que cargar rápido en celular (LCP < 2,5 s), probar dos títulos del hero y guardar todo sin herramientas pagas.

## Decisión
- Las dos versiones (`/l/a`, `/l/b`) son páginas estáticas, servidas desde el CDN.
- `src/proxy.ts` reparte la variante en `/` con cookie fija por visitante (`tim_var`) y un id aleatorio (`tim_vid`), y hace rewrite. La URL que ve la persona sigue siendo `/`.
- La medición va a la base propia: `interesados` y `eventos_landing`. Entra solo por el servidor (zod + rate limit por hash de IP con sal). Lee solo el organizador.

## Alternativas descartadas
- **Variante elegida en el render**: la página deja de ser estática.
- **Google Analytics, PostHog, etc.**: terceros con los datos, cookies de consentimiento, y en algunos casos pagos.
- **Insert directo desde el navegador con RLS**: cualquier script llena la tabla.

## Consecuencias
- El proxy no aplica a `/l/*` ni a `/api/landing` (matcher).
- El panel de organizador lee conversión por audiencia, origen y variante desde las dos tablas.
