# Arranque de TIM en una compu nueva (instrucciones para el agente)

Este archivo es para Codex, no para una persona. La persona (Sofía) no es técnica: no le pidas que corra comandos. Pedile solo los clics de autorización en el navegador y, si hace falta instalar Homebrew, la contraseña de su Mac.
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

### Cómo le pide cosas Sofía después
En castellano, como a alguien del equipo: "cambiá el título de la landing", "armá el evento", "¿cuántos se anotaron?", "publicalo". `AGENTS.md` tiene el mapa de qué leer para cada pedido.
