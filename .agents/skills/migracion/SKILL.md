---
name: migracion
description: Para cambiar la base de datos de TIM (tabla, columna, permiso, función) y llevar el cambio a tim-dev y tim-prod. Se dispara con "agregá un campo", "hace falta guardar...", "nueva tabla", "cambiá quién puede ver...", "migrá", "subí el cambio de la base", "el mentor no puede ver X y debería".
---

# Migración

Reglas de formato y de funciones: `.claude/rules/datos-y-migraciones.md`. Esto es el procedimiento. Lo corre el agente.

Camino: **`tim-dev` → producción.** Nunca directo a producción. (Con Docker instalado se puede probar antes en local con `supabase db reset`; no hace falta.)

## 1. Escribir la migración
- Archivo nuevo `supabase/migrations/NNN_nombre.sql`, con el número siguiente al último.
- Comentario con el porqué arriba, `BEGIN; ... COMMIT;`.
- RLS y policies en el mismo archivo. Funciones `security definer` con `search_path = ''` y EXECUTE revocado por nombre.
- **Nunca editar una migración que ya está en prod.** Para saber cuáles están: `supabase migration list` con el proyecto linkeado. Si ya está, se corrige con una nueva.

## 2. Aplicar a tim-dev y probar
```bash
pnpm migrar dev            # aplica lo pendiente en tim-dev; tiene que terminar sin errores
pnpm db:tipos              # regenera src/lib/supabase/tipos.ts desde tim-dev
pnpm test:rls              # sumar el caso nuevo: el rol que no debe ver, no ve
pnpm verificar             # con el dev server parado
```
Recorrer el flujo afectado con `pnpm dev` y cuentas `prueba-` (`pnpm datos:prueba`).

## 3. ¿Es destructiva?
Destructiva = `DROP`, cambio de tipo, `NOT NULL` sobre datos existentes, `UPDATE`/`DELETE` masivo.
- Aditiva: sigue sin ceremonia.
- Destructiva: antes de prod, backup de los datos de `public` (el CLI no filtra por tabla; `-x public.eventos_landing` excluye una si pesa):
  ```bash
  mkdir -p ~/tim-backups
  supabase db dump --linked --data-only -s public -f ~/tim-backups/$(date +%Y%m%d-%H%M)-datos.sql
  ```
  Fuera del repo (tiene datos personales). Avisar en una línea qué se respaldó y dónde.

## 4. Aplicar a producción
```bash
pnpm migrar prod           # aplica lo pendiente en producción y deja el CLI apuntando a tim-dev
```
La migración va a prod **antes** del deploy del código que la usa. Si el código nuevo corre contra una base vieja, falla.

## 5. Cerrar
- `docs/modelo-de-datos.md` actualizado.
- Datos `prueba-` borrados en dev (`pnpm datos:limpiar`) y, si se usaron, en producción (`ENV_ARCHIVO=.env.prod pnpm datos:limpiar`).
- Seguir con la skill `deploy` si hay código.

## Si `db push` falla en remoto
- No editar a mano la base remota para "destrabar". Leer el error, corregir con una migración nueva, repetir desde el paso 2.
- Backup antes de algo destructivo en producción: `supabase link --project-ref xvzkijllizurvmmhmxvl`, el `db dump` del paso 3, y `pnpm migrar dev` para volver a apuntar a dev.
- Si quedó a medias: las migraciones van en `BEGIN/COMMIT`, así que no debería; confirmalo con `supabase migration list` antes de reintentar.
