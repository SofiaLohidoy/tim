# Empezar a trabajar en TIM con Codex

Para Sofía. Vos no tenés que saber nada técnico: Codex hace todo. Lo único tuyo son unos clics.

## Una sola vez
1. Creá una carpeta vacía, por ejemplo `Documentos/TIM`, y abrila en Codex.
2. Pegale este mensaje:

```text
Quiero trabajar en TIM, la plataforma de mi tesis. No soy técnica: hacé vos todo y pedime solo los clics en el navegador.
Cloná el repo en esta misma carpeta con: gh repo clone programon-arg/tim .
(si falta gh, instalalo con Homebrew y corré gh auth login --web).
Después leé AGENTS.md entero y seguí, paso a paso, la sección "Para el agente" de docs/empezar-con-codex.md.
Al final contame en tres líneas qué quedó andando y abrime la app en el navegador.
```

3. Mientras trabaja, Codex te va a pedir algunas cosas. Decí que sí a todo:
   - Que confíes en la carpeta o le des permiso para seguir.
   - Un clic en el navegador para GitHub y otro para Supabase. Entrá con tu cuenta de siempre.
   - Si tu Mac no tiene Homebrew, la contraseña de tu compu, una sola vez.

Tarda unos 10 minutos. Cuando termina, te abre TIM funcionando en tu compu.

## Todos los días
Abrí la carpeta `TIM` en Codex y pedile las cosas como se las pedirías a alguien del equipo:
- "Cambiá el título de la landing por …"
- "Armá el evento de la hackatón del sábado"
- "Sumá a Juan como mentor del equipo 3"
- "¿Cuántos se anotaron en la landing esta semana?"
- "Publicalo"

Codex prueba los cambios en una base de práctica (`tim-dev`) y los publica en https://tim-alpha-eight.vercel.app cuando le decís. Si algo no sale, pedile "fijate qué pasó y arreglalo".

---

## Para el agente
Seguí estos pasos en orden, sin pedirle a Sofía que corra nada. Cada paso se puede repetir.

### 1. Herramientas
Si falta algo, instalalo con Homebrew (macOS; si no hay Homebrew, instalalo desde brew.sh): `node` (20 o más), `pnpm`, `gh`, `supabase/tap/supabase`. No hace falta Docker.

### 2. Repo y dependencias
```bash
gh auth status || gh auth login --web      # Sofía hace un clic
# (el repo ya está clonado en esta carpeta)
pnpm install
pnpm exec playwright install chromium
```

### 3. Supabase y variables
```bash
supabase login                              # Sofía hace un clic
pnpm preparar prod
```
`pnpm preparar` crea la base de práctica `tim-dev` si no existe (tarda unos 2 minutos), le aplica el esquema y la configuración, y escribe `.env.local`. Con `prod` también escribe `.env.prod`, para reportes. No hace falta ninguna clave: entra con la sesión de `supabase login`.

### 4. Comprobar que todo anda
```bash
pnpm dev                                    # en segundo plano (puerto 3001)
pnpm datos:prueba                           # cuentas prueba- en tim-dev
pnpm e2e                                    # 11 flujos de punta a punta; tienen que pasar todos
pnpm datos:prueba && pnpm capturas          # pantallas en capturas/; mirá un par
```
Si algo falla, skill `verificar`, y arreglalo antes de seguir.

### 5. Contarle a Sofía y dejarla entrando
- Abrile http://localhost:3001 en el navegador.
- Para que vea el panel de organización en su compu: entrá con `prueba-organizador@tim.test` y la clave `PRUEBA_CLAVE` de `.env.local`. En producción entra con su propia cuenta (ya es organizadora).
- Contale en tres líneas qué quedó andando. Sin jerga.
- Dejá corriendo `pnpm dev` si va a seguir trabajando. Si no, pará el servidor y borrá lo de prueba con `pnpm datos:limpiar`.

### Lo que ya está resuelto
- **Publicar**: push a `main` y `pnpm esperar-publicacion` (skill `deploy`). No hace falta cuenta de Vercel.
- **Cambiar la base**: `pnpm migrar dev`, probar, `pnpm migrar prod` (skill `migracion`).
- **Permisos de Codex**: `.codex/config.toml` hace que Codex no pida aprobar cada comando, una vez que Sofía confía en la carpeta.
- **Producción**: proyecto `TIM` de Supabase (ref `xvzkijllizurvmmhmxvl`) y https://tim-alpha-eight.vercel.app.
