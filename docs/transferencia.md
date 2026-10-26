# Transferencia a Sofía

Fase F. Se hace al cerrar la tesis o cuando Sofía lo pida. La base ya vive en su Supabase desde el día 1; lo que se transfiere es el código y el hosting.

Lo ejecuta Claude. Lo único que hace Sofía es crear sus cuentas y aceptar las invitaciones.

## Antes de arrancar
- [ ] No hay datos `prueba-` en `tim-prod` (`pnpm datos:limpiar` contra prod, y revisarlo con un `select`).
- [ ] `pnpm verificar`, `pnpm test:rls` y `pnpm e2e` en verde.
- [ ] `docs/roadmap.md` al día.

## Checklist
1. [ ] **Sofía crea GitHub y Vercel** (Vercel Hobby, con su GitHub).
2. [ ] **Revisar que el historial no tenga secretos**, porque el repo va a ser público:
   - `git log -p | grep -iE "sb_secret_|service_role|CRON_SECRET=|LANDING_SAL=|client_secret"` sin resultados con valores reales.
   - Ningún `.env*` commiteado salvo `.env.example` (`git log --all --diff-filter=A --name-only | grep -E "^\.env"`).
   - Si aparece un secreto: rotarlo en el servicio **antes** de hacer público el repo. Reescribir historia no alcanza: puede haber copias.
3. [ ] **Transferir el repo** `programon-arg/tim` a la cuenta de Sofía (GitHub → Settings → Transfer) y **hacerlo público**. Vercel Hobby bloquea deploys de commits de terceros en repos privados.
4. [ ] **Importarlo en su Vercel** y cargar las env vars de `.env.example` con los valores de `tim-prod` (ver `docs/puesta-en-marcha.md`, paso 5). Generar `CRON_SECRET` nuevo. Mantener `LANDING_SAL` igual, para que el rate limit siga siendo coherente.
5. [ ] Confirmar que el cron `/api/cron/salud` aparece en su Vercel.
6. [ ] **Actualizar las URLs en Supabase Auth**: Site URL y Redirect URLs a la URL nueva (`/auth/callback`). Y en Google Cloud, los orígenes autorizados.
7. [ ] **Verificar que quedó live**: `vercel inspect` hasta `READY`, y recorrer landing, registro, `/inicio` y `/organizador` en la URL nueva.
8. [ ] **Recién ahí, borrar el proyecto viejo** en el Vercel de Programon. Avisar antes: no se deshace.
9. [ ] Actualizar este archivo con la fecha y la URL nueva, y la línea de `tim` en `~/Projects/CLAUDE.md`.

## Después
- El equipo sigue trabajando con su propio Claude sobre el repo. El harness (`CLAUDE.md`, `.claude/`) viaja con el repo.
- Si Sofía quiere dominio y mails propios: dominio + Resend + prender confirmación de mail (revisar `docs/decisiones/002-login.md`).
