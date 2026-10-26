# TIM

TIM es la plataforma de la tesis de Sofía Lohidoy (UTDT, Desarrollo de Nuevos Negocios, equipo Beitzá). Es el VPP: valida el problema y la solución, no vende. Jóvenes resuelven desafíos, mentores y jurados los observan con una rúbrica, y esa evidencia arma su perfil de habilidades blandas. Hito: hackatón del sábado 31/10/2026.

Stack: Next 16.4 (App Router) · Supabase (Postgres, Auth, Storage, RLS) · Vercel · pnpm. Plan completo: `docs/plan-maestro.md`. Vocabulario: `CONTEXT.md`.

@AGENTS.md

## Quién trabaja acá
El equipo de TIM no es técnico. **La persona no corre comandos: Claude levanta, migra, verifica y deploya.** Nunca le pidas que abra una terminal, Vercel, Supabase o un log. Si algo necesita lectura técnica, la hacés vos y le das la conclusión en castellano llano. Decidí con supuestos razonables y anotalos en una línea. Preguntá solo una regla de negocio que queda en los datos (rúbrica, evaluación, qué se mide), una vez y con tu recomendación.

## Te piden X → leé Y
| Te piden | Leé |
|---|---|
| Una pantalla, un formulario, algo visual | `.claude/rules/diseno.md` + skill `diseno-de-la-app` |
| Animación, "que se sienta mejor" | skill `emil-design-eng` |
| Textos de la app | `.claude/rules/textos.md` |
| Copy de la landing | skill `content-strategy` + `docs/landing-contenido.md` |
| Algo nuevo de punta a punta | skill `nueva-funcionalidad` |
| Cambiar la base (tabla, columna, permiso) | skill `migracion` + `.claude/rules/datos-y-migraciones.md` + `docs/modelo-de-datos.md` |
| Probar que anda | skill `verificar` |
| Publicar | skill `deploy` |
| Preparar la hackatón u otro evento | skill `preparar-evento` |
| "¿Qué hacemos el sábado?", el paso a paso del día | `docs/guia-del-dia.md` |
| Un juego nuevo | skill `nueva-actividad` + `docs/senales.md` |
| Números para la tesis | skill `reporte-tesis` |
| Arrancar en una compu nueva | `docs/trabajar-en-local.md` |
| Cuentas, límites, "se pausó la base" | `docs/infraestructura.md` |
| Crear los proyectos en Supabase y Vercel | `docs/puesta-en-marcha.md` |
| Por qué algo es así | `docs/decisiones/` |
| Qué sigue | `docs/roadmap.md` |
| Pasarle el proyecto a Sofía | `docs/transferencia.md` |
| Seguridad o datos personales | `.claude/rules/seguridad.md` |
| Algo que se repite y merece skill | skill `grow` |

## Reglas duras
1. **RLS en toda tabla.** Quién ve qué se hace cumplir en la base, no en la UI.
2. **La clave secreta (`SUPABASE_SECRET_KEY`) nunca llega al cliente.** Saltea la RLS. Solo en `src/lib/supabase/servicio.ts`, con `server-only`.
3. **Nunca datos de prueba como reales.** Todo lo de prueba lleva el prefijo `prueba-` y se borra al terminar (`pnpm datos:limpiar`).
4. **El anonimato se hace cumplir en la base.** La empresa nunca lee estudiantes directo: vista anónima + función `security definer` que exige un contacto aceptado.
5. **Las señales nunca se presentan como "medición validada".** Son hipótesis de la tesis. En la UI se dice "señal".
6. **Sin monetización en esta etapa.** Nada de precios, planes, pagos ni estados comerciales.
7. **Un desafío es solo evaluación**, nunca trabajo productivo gratis para una empresa.
8. **Next 16.4 no es el Next que conocés.** Antes de usar una API, leé `node_modules/next/dist/docs/`. `cacheComponents` está activo. El middleware se llama `src/proxy.ts`.
9. **Nada de "listo" sin verificar**: `pnpm verificar` en verde, la pantalla vista a 375 y 1280 px, y el deploy live recorrido.
10. **Estándares externos** (APIs, specs, versiones): se verifican en la fuente oficial y se anotan en el código.
