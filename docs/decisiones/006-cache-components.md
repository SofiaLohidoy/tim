# 006 — `cacheComponents` activo

Fecha: 25/10/2026 · Estado: aceptada

## Contexto
Next 16 trae Cache Components: el render es dinámico por defecto y lo cacheable se marca explícito (`"use cache"`), con prerender parcial. Cambia cómo se escribe el acceso a datos respecto del Next que conoce cualquier tutorial.

## Decisión
`cacheComponents: true` en `next.config.ts`, desde el día 1.

## Por qué
- La landing y las partes fijas salen estáticas; lo que depende de la sesión se resuelve por pedido.
- Arrancar con el modelo nuevo sale más barato que migrar después.

## Consecuencias
- Antes de usar una API de datos, caché, `cookies()`, `headers()` o `params`, leer `node_modules/next/dist/docs/`. Lo que recuerdes de Next 14/15 puede estar mal.
- Lo que lee la sesión o datos privados no se cachea entre personas. Nunca `"use cache"` sobre algo que depende del usuario.
- Errores del tipo "uncached data accessed outside of Suspense": envolver en `<Suspense>` o mover el acceso; no apagar `cacheComponents`.
