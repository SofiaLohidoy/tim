---
name: nueva-funcionalidad
description: Para agregar algo nuevo a TIM de punta a punta (pantalla + datos + permisos). Se dispara con "quiero que la app haga...", "agregá...", "sumá una pantalla para...", "que el mentor pueda...", "que el organizador vea...", "necesitamos una función nueva", "armá la parte de...".
---

# Nueva funcionalidad

Orden fijo: spec corta → migración → UI → tests → verificar → deploy. No se saltea ningún paso. La persona no corre nada: todo lo hace Claude.

## 1. Spec corta (antes de tocar código)
Escribila en el chat, en 5 a 10 líneas:
- **Para quién** (estudiante, mentor, jurado, organizador) y **qué problema** resuelve.
- **En qué fase** del roadmap cae (`docs/roadmap.md`). Si es de una fase futura y la hackatón todavía no pasó, decilo: se recorta todo lo que no se usa el sábado.
- **Qué ve y qué toca** cada rol. Quién **no** tiene que ver esto.
- **Datos**: qué tabla o columna nueva, con términos de `CONTEXT.md`.
- **Chequeos contra las reglas duras** de `CLAUDE.md`: ¿toca anonimato, señales, monetización, desafíos como trabajo gratis? Si sí, frená y preguntá.

Si falta una regla de negocio que queda en los datos (qué se mide, cómo se evalúa), preguntala una vez, con tu recomendación. Lo demás, decidilo y anotalo en una línea.

## 2. Migración (si hay datos nuevos)
Skill `migracion`. Tabla + RLS + policies + helpers en el mismo archivo. Regenerar tipos. Actualizar `docs/modelo-de-datos.md`.

## 3. UI
- Leé `.claude/rules/diseno.md`, `.claude/rules/textos.md` y la skill `diseno-de-la-app`.
- **Next 16.4**: antes de usar una API, leé la guía en `node_modules/next/dist/docs/`. `cacheComponents` está activo: nada que dependa del usuario va con `"use cache"`.
- Server Components por defecto. `"use client"` solo donde hay interacción.
- Mutaciones por Server Action con zod. Cliente de Supabase con la sesión (`src/lib/supabase/servidor.ts`). La clave secreta (`servicio.ts`) solo si no hay sesión y hay validación propia.
- Errores de la base traducidos a un texto que dice qué hacer.

## 4. Tests
- Lógica pura: Vitest, al lado del archivo.
- Permisos: un caso en `pnpm test:rls` que pruebe que el rol que **no** debe ver, no ve.
- Flujo crítico (registro, asistencia, evaluación, publicación): Playwright (`pnpm e2e`).

## 5. Verificar
Skill `verificar`: `pnpm verificar` con el dev server parado, `pnpm test:rls`, `pnpm e2e`, y la pantalla mirada a 375 y 1280 px.

## 6. Deploy
Skill `deploy`. Push a `main`, `vercel inspect` hasta `READY`, recorrer el flujo en la URL live. Si hay migración, primero se aplica a `tim-dev` y `tim-prod` (skill `migracion`), después se pushea el código.

## 7. Cerrar
- Datos `prueba-` borrados.
- `docs/roadmap.md` al día si se cerró algo de una fase.
- Si se tomó una decisión de arquitectura, un ADR corto en `docs/decisiones/`.
- A la persona: qué cambió, dónde verlo (la URL), y qué quedó pendiente. En castellano llano, sin jerga.
