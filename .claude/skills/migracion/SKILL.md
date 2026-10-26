---
name: migracion
description: Para cambiar la base de datos de TIM (tabla, columna, permiso, función) y llevar el cambio a tim-dev y tim-prod. Se dispara con "agregá un campo", "hace falta guardar...", "nueva tabla", "cambiá quién puede ver...", "migrá", "subí el cambio de la base", "el mentor no puede ver X y debería".
---

# Migración

Reglas de formato y de funciones: `.claude/rules/datos-y-migraciones.md`. Esto es el procedimiento. Lo corre Claude.

Camino: **local con `supabase db reset` → `tim-dev` → `tim-prod`.** Nunca directo a prod.

## 1. Escribir la migración
- Archivo nuevo `supabase/migrations/NNN_nombre.sql`, con el número siguiente al último.
- Comentario con el porqué arriba, `BEGIN; ... COMMIT;`.
- RLS y policies en el mismo archivo. Funciones `security definer` con `search_path = ''` y EXECUTE revocado por nombre.
- **Nunca editar una migración que ya está en prod.** Para saber cuáles están: `supabase migration list` con el proyecto linkeado. Si ya está, se corrige con una nueva.

## 2. Probar en local
```bash
supabase db reset          # aplica todo desde cero; tiene que terminar sin errores
supabase gen types typescript --local > src/lib/supabase/tipos.ts
pnpm test:rls              # sumar el caso nuevo: el rol que no debe ver, no ve
pnpm verificar             # con el dev server parado
```

## 3. ¿Es destructiva?
Destructiva = `DROP`, cambio de tipo, `NOT NULL` sobre datos existentes, `UPDATE`/`DELETE` masivo.
- Aditiva: sigue sin ceremonia.
- Destructiva: antes de prod, backup de los datos de `public` (el CLI no filtra por tabla; `-x public.eventos_landing` excluye una si pesa):
  ```bash
  mkdir -p ~/tim-backups
  supabase db dump --linked --data-only -s public -f ~/tim-backups/$(date +%Y%m%d-%H%M)-datos.sql
  ```
  Fuera del repo (tiene datos personales). Avisar en una línea qué se respaldó y dónde.

## 4. Aplicar a tim-dev
```bash
supabase link --project-ref <ref de tim-dev>
supabase db push
```
Recorrer el flujo afectado contra `tim-dev` (Playwright o a mano con cuentas `prueba-`).

## 5. Aplicar a tim-prod
```bash
supabase link --project-ref <ref de tim-prod>
supabase migration list    # confirmar qué falta
supabase db push
supabase link --project-ref <ref de tim-dev>   # dejar linkeado dev, para no pushear a prod por accidente
```
La migración va a prod **antes** del deploy del código que la usa. Si el código nuevo corre contra una base vieja, falla.

## 6. Cerrar
- `docs/modelo-de-datos.md` actualizado.
- Datos `prueba-` borrados en dev y prod (`pnpm datos:limpiar`).
- Seguir con la skill `deploy` si hay código.

## Si `db push` falla en remoto
- No editar a mano la base remota para "destrabar". Leer el error, corregir con una migración nueva, repetir desde el paso 2.
- Si quedó a medias: las migraciones van en `BEGIN/COMMIT`, así que no debería; confirmalo con `supabase migration list` antes de reintentar.
