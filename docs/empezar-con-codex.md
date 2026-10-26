# Empezar a trabajar en TIM con Codex

Para Sofía (o quien siga el proyecto). Hay una parte que es tuya (cuentas y clics de autorización) y una que hace Codex solo.

## 1. Lo tuyo, una sola vez (10 minutos)
1. **GitHub**: si no tenés cuenta, creala en github.com. Pasale tu usuario a Joaquín para que te dé acceso al repo `programon-arg/tim`. Aceptá la invitación que te llega por mail.
2. **Supabase**: ya tenés el proyecto `TIM` (producción). Tené la sesión abierta en el navegador.
3. **Codex**: abrilo en una carpeta vacía (por ejemplo `Documentos/TIM`) y pegale el prompt de abajo.

Durante el arranque Codex te va a pedir que hagas clic en algunas pantallas del navegador (autorizar GitHub y Supabase). Es lo único que tenés que hacer.

## 2. El prompt para Codex
Copiá y pegá esto tal cual:

```text
Quiero trabajar en TIM, la plataforma de mi tesis. Yo no soy técnica: hacé vos todo lo que haga falta y pedime solo los clics de autorización en el navegador.

1. Cloná el repo con GitHub CLI: gh repo clone programon-arg/tim (si no tenés gh o no estoy logueada, instalalo y corré gh auth login).
2. Entrá a la carpeta tim, leé AGENTS.md entero y después la sección "Para el agente" de docs/empezar-con-codex.md. Seguila paso a paso.
3. Cuando termines, contame en tres líneas qué quedó andando y abrime la app local en el navegador.
```

## 3. Después, el día a día
Le hablás a Codex como a una persona del equipo: "cambiá el título de la landing", "armá el evento de la hackatón", "¿cuántos se anotaron?", "publicalo". Codex sabe dónde está cada cosa: `AGENTS.md` tiene el mapa y las skills de `.agents/skills/` tienen los procedimientos.

---

## Para el agente
Seguí estos pasos en orden. Cada uno se puede repetir sin romper nada. No le pidas a Sofía que corra comandos: corrélos vos y pedile solo los clics de autorización.

### A. Herramientas
Comprobá y, si falta algo, instalá con Homebrew (macOS): `node` (20 o más), `pnpm`, `gh`, `supabase/tap/supabase`. No hace falta Docker: se trabaja contra `tim-dev` en la nube.

```bash
pnpm install
pnpm exec playwright install chromium
```

### B. Supabase de desarrollo (`tim-dev`)
Nunca se prueba contra producción. Se usa un proyecto aparte en la misma cuenta de Sofía.

1. `supabase login` (Sofía hace clic en el navegador).
2. Buscá la organización de Sofía con `supabase orgs list` (hoy: `fztbouwpdevyqpnkndsv`) y fijate con `supabase projects list` si ya existe `tim-dev`. Si no existe, crealo en la misma región que producción:
   ```bash
   supabase projects create tim-dev --org-id <org> --region us-east-2 --db-password "<generá una clave larga al azar>"
   ```
   Guardá esa clave solo en `.env.local` (variable `SUPABASE_DB_PASSWORD`), que no se sube al repo. Esperá a que el proyecto quede activo (`supabase projects list`).
3. Aplicá el esquema y la configuración de Auth (confirmación de mail apagada, URL local, límites):
   ```bash
   supabase link --project-ref <ref de tim-dev> -p "$SUPABASE_DB_PASSWORD"
   supabase db push -p "$SUPABASE_DB_PASSWORD"
   supabase config push --project-ref <ref de tim-dev>
   ```
4. Armá `.env.local` a partir de `.env.example`. Las claves salen de `supabase projects api-keys --project-ref <ref de tim-dev>` (la `publishable` y la `secret`). `NEXT_PUBLIC_SITIO_URL=http://localhost:3001`, `NEXT_PUBLIC_ACTIVIDADES=1`. `LANDING_SAL` y `CRON_SECRET`: cualquier texto largo al azar.

### C. Comprobar que anda
```bash
pnpm datos:prueba          # cuentas prueba- en tim-dev
pnpm dev                   # en segundo plano, puerto 3001
pnpm capturas              # pantallas a 375 y 1280 px en capturas/
pnpm e2e                   # 11 flujos de punta a punta
pnpm datos:limpiar
```
Mirá dos o tres capturas. Si algo falla, skill `verificar`.

### D. Producción
- Producción es el proyecto `TIM` de Supabase (ref `xvzkijllizurvmmhmxvl`) y la app en https://tim-alpha-eight.vercel.app.
- Un cambio de base va primero a `tim-dev` y después a producción (skill `migracion`).
- Publicar es push a `main` (skill `deploy`). Mientras el proyecto de Vercel siga en la cuenta de Programon, un push de Sofía puede quedar sin publicar: en ese caso avisale a Joaquín, o seguí `docs/transferencia.md` para pasarlo a las cuentas de Sofía.

### E. Contarle a Sofía
En tres líneas: qué quedó andando, la URL local y que puede pedirte cosas en castellano. Abrile `http://localhost:3001` en el navegador.
