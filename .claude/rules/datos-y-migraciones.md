# Datos y migraciones

Procedimiento paso a paso: skill `migracion`. Mapa de tablas: `docs/modelo-de-datos.md`.

## Formato de una migración
- Archivo `supabase/migrations/NNN_nombre.sql`, numerado de a uno (`006_actividades.sql`). Nombre en castellano, corto.
- Arriba, un comentario con **el porqué**: qué problema resuelve y por qué así y no de otra forma. Es la documentación que más se lee.
- Todo adentro de `BEGIN; ... COMMIT;`.
- Nombres en castellano y `snake_case`, coherentes con `CONTEXT.md`.

```sql
-- 006 — Actividades y partidas.
--
-- Por que asi:
-- - ...

BEGIN;
...
COMMIT;
```

## Reglas
- **Nunca editar una migración ya aplicada en prod.** Se corrige con una nueva.
- **Aditivo a prod sin ceremonia**: tablas, columnas nullable, índices, policies nuevas.
- **Lo destructivo con backup**: `DROP`, `ALTER ... TYPE`, `NOT NULL` sobre datos existentes, `UPDATE`/`DELETE` masivos. Antes, exportar los datos (`supabase db dump --linked --data-only -s public -f ~/tim-backups/<fecha>-datos.sql`) y guardar el archivo fuera del repo.
- **RLS en toda tabla**, en la misma migración que la crea: `ENABLE ROW LEVEL SECURITY` + policies explícitas por rol.
- Las policies usan `(SELECT auth.uid())`, no `auth.uid()` suelto (se evalúa una vez por query).
- Un chequeo que consulta otra tabla con RLS va en una función helper, no en un `exists()` dentro de la policy (rechaza siempre o entra en recursión).

## Funciones
- Helpers de RLS y funciones que llama la app: `SECURITY DEFINER`, `STABLE` cuando solo leen, y **`SET search_path = ''`** con todo calificado (`public.tabla`, `auth.uid()`).
- **Revocar EXECUTE por nombre**: Supabase da EXECUTE a `anon` y `authenticated` por defecto. Revocar a `PUBLIC` no alcanza.
  ```sql
  REVOKE ALL ON FUNCTION public.mi_funcion(uuid) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.mi_funcion(uuid) TO authenticated;  -- solo si la app la llama
  ```
- Funciones de trigger: revocadas a todos, sin GRANT.
- Una función que recibe datos del usuario valida adentro (sesión, pertenencia, formato) y tira un error con nombre (`RAISE EXCEPTION 'codigo_invalido'`) que la app traduce a un texto útil.

## Columnas
- Estados como `text` con `CHECK (... IN (...))`, no enums de Postgres (más fáciles de ampliar).
- `creado_en` y `actualizado_en` (`timestamptz`), con el trigger `poner_actualizado_en()`.
- Mails en `extensions.citext`.
- Límites de largo con `CHECK (char_length(...) <= N)` en los textos libres.
- Ningún valor numérico en niveles de rúbrica (ver `docs/decisiones/004-niveles-sin-puntaje.md`).

## Después de cada migración
1. `pnpm migrar dev`, sin errores (o `supabase db reset` si trabajás con Supabase local).
2. Regenerar tipos: `pnpm db:tipos`.
3. Test de RLS del caso nuevo en `pnpm test:rls`.
4. Actualizar `docs/modelo-de-datos.md`.

## Datos de prueba
- Prefijo `prueba-` en mail y nombre. Se crean con `pnpm datos:prueba` y se borran con `pnpm datos:limpiar`.
- En `tim-dev` y `tim-prod` se borran al terminar, siempre.
